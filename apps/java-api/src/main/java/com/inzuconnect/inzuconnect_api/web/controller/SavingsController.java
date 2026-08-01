package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import jakarta.transaction.Transactional;
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

    // 1. Consulter le solde d'épargne et le statut d'activation
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

    // 2. Activer / Désactiver la micro-épargne automatique de 10%
    @PostMapping("/toggle")
    @Transactional
    public ResponseEntity<?> toggleSavings(@RequestBody Map<String, Object> body) {
        Boolean enabled = (Boolean) body.get("enabled");

        if (enabled == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Le paramètre 'enabled' (true ou false) est requis."));
        }

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        if (currentUser.getRole() != Role.HOST && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - Cette fonctionnalité est réservée aux Hôtes."));
        }

        currentUser.setMicroSavingsEnabled(enabled);
        currentUser = userRepository.save(currentUser);

        String stateLabel = enabled ? "activée" : "désactivée";
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "La micro-épargne automatique a été " + stateLabel + " avec succès.",
                "microSavingsEnabled", currentUser.isMicroSavingsEnabled(),
                "savingsBalance", currentUser.getSavingsBalance()
        ));
    }

    // 3. Retirer de l'argent vers le compte Lumicash/EcoCash principal
    @PostMapping("/withdraw")
    @Transactional
    public ResponseEntity<?> withdrawSavings(@RequestBody Map<String, Object> body) {
        Object amountObj = body.get("amount");
        if (amountObj == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Le montant du retrait 'amount' doit être fourni."));
        }

        int amount = ((Number) amountObj).intValue();
        if (amount <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Le montant du retrait 'amount' doit être supérieur à 0."));
        }

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        if (currentUser.getRole() != Role.HOST && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - Cette fonctionnalité est réservée aux Hôtes."));
        }

        if (currentUser.getSavingsBalance() < amount) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", 
                    "Solde d'épargne insuffisant. Solde disponible : " + String.format("%,d", currentUser.getSavingsBalance()) + " BIF."));
        }

        currentUser.setSavingsBalance(currentUser.getSavingsBalance() - amount);
        userRepository.save(currentUser);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Le retrait de " + String.format("%,d", amount) + " BIF vers votre compte mobile money (" + (currentUser.getPhone() != null ? currentUser.getPhone() : "par défaut") + ") a été effectué avec succès.",
                "savingsBalance", currentUser.getSavingsBalance()
        ));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByPhone(email).orElse(null));
    }
}
