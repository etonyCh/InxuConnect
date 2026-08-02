package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.User;
import com.inzuconnect.inzuconnect_api.domain.enums.Role;
import com.inzuconnect.inzuconnect_api.repository.UserRepository;
import com.inzuconnect.inzuconnect_api.web.dto.SavingsToggleDto;
import com.inzuconnect.inzuconnect_api.web.dto.SavingsWithdrawDto;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/host/savings")
public class SavingsController {

    private final UserRepository userRepository;

    public SavingsController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getSavings() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        if (currentUser.getRole() != Role.HOST && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - Cette fonctionnalité est réservée aux Hôtes."));
        }

        return ResponseEntity.ok(Map.of(
                "microSavingsEnabled", currentUser.isMicroSavingsEnabled(),
                "savingsBalance", currentUser.getSavingsBalance()
        ));
    }

    @PostMapping("/toggle")
    @Transactional
    public ResponseEntity<?> toggleSavings(@Valid @RequestBody SavingsToggleDto dto) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        if (currentUser.getRole() != Role.HOST && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - Cette fonctionnalité est réservée aux Hôtes."));
        }

        currentUser.setMicroSavingsEnabled(dto.getEnabled());
        currentUser = userRepository.save(currentUser);

        String stateLabel = dto.getEnabled() ? "activée" : "désactivée";
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "La micro-épargne automatique a été " + stateLabel + " avec succès.",
                "microSavingsEnabled", currentUser.isMicroSavingsEnabled(),
                "savingsBalance", currentUser.getSavingsBalance()
        ));
    }

    @PostMapping("/withdraw")
    @Transactional
    public ResponseEntity<?> withdrawSavings(@Valid @RequestBody SavingsWithdrawDto dto) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        if (currentUser.getRole() != Role.HOST && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - Cette fonctionnalité est réservée aux Hôtes."));
        }

        if (currentUser.getSavingsBalance() < dto.getAmount()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error",
                    "Solde d'épargne insuffisant. Solde disponible : " + String.format("%,d", currentUser.getSavingsBalance()) + " BIF."));
        }

        currentUser.setSavingsBalance(currentUser.getSavingsBalance() - dto.getAmount());
        userRepository.save(currentUser);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Le retrait de " + String.format("%,d", dto.getAmount()) + " BIF vers votre compte mobile money (" + (currentUser.getPhone() != null ? currentUser.getPhone() : "par défaut") + ") a été effectué avec succès.",
                "savingsBalance", currentUser.getSavingsBalance()
        ));
    }

    private User getCurrentUser() {
        var ctx = SecurityContextHolder.getContext();
        if (ctx == null || ctx.getAuthentication() == null || !ctx.getAuthentication().isAuthenticated()) {
            return null;
        }
        String principal = ctx.getAuthentication().getName();
        if (principal == null || principal.isBlank()) return null;
        Optional<User> u = userRepository.findByEmail(principal);
        return u.orElseGet(() -> userRepository.findByPhone(principal).orElse(null));
    }
}
