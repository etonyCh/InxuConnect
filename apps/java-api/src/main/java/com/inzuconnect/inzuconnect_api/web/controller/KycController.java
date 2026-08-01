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
@RequestMapping("/api/kyc")
public class KycController {

    private final KycRequestRepository kycRequestRepository;
    private final UserRepository userRepository;

    public KycController(KycRequestRepository kycRequestRepository, UserRepository userRepository) {
        this.kycRequestRepository = kycRequestRepository;
        this.userRepository = userRepository;
    }

    // 1. Soumission des pièces d'identité
    @PostMapping("/submit")
    @Transactional
    public ResponseEntity<?> submitKyc(@RequestBody Map<String, String> body) {
        String cniUrl = body.get("cniUrl");
        String selfieUrl = body.get("selfieUrl");

        if (cniUrl == null || selfieUrl == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "CNI URL et Selfie URL requis"));
        }

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<KycRequest> optionalKyc = kycRequestRepository.findByUserId(currentUser.getId());
        KycRequest kycRequest;

        if (optionalKyc.isPresent()) {
            kycRequest = optionalKyc.get();
            kycRequest.setCniUrl(cniUrl);
            kycRequest.setSelfieUrl(selfieUrl);
            kycRequest.setStatus(KycStatus.PENDING);
        } else {
            kycRequest = new KycRequest();
            kycRequest.setUser(currentUser);
            kycRequest.setCniUrl(cniUrl);
            kycRequest.setSelfieUrl(selfieUrl);
            kycRequest.setStatus(KycStatus.PENDING);
        }

        kycRequestRepository.save(kycRequest);

        currentUser.setKycStatus(KycStatus.PENDING);
        userRepository.save(currentUser);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Demande KYC soumise et en cours d'examen",
                "kycRequest", kycRequest
        ));
    }

    // 2. Webhook de simulation de Smile Identity (Public)
    @PostMapping("/webhook")
    @Transactional
    public ResponseEntity<?> kycWebhook(@RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        String result = body.get("result");

        if (userId == null || result == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "userId et result (APPROVED/REJECTED) requis"));
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Utilisateur introuvable"));
        }

        User user = optionalUser.get();
        Optional<KycRequest> optionalKyc = kycRequestRepository.findByUserId(userId);
        if (optionalKyc.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Demande KYC introuvable"));
        }

        KycRequest kycRequest = optionalKyc.get();

        KycStatus status = result.equalsIgnoreCase("APPROVED") ? KycStatus.VERIFIED : KycStatus.REJECTED;
        Badge badge = result.equalsIgnoreCase("APPROVED") ? Badge.VERIFIED : Badge.NONE;

        kycRequest.setStatus(status);
        kycRequestRepository.save(kycRequest);

        user.setKycStatus(status);
        user.setBadge(badge);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Webhook KYC traité. Utilisateur mis à jour avec le statut: " + status + " et badge: " + badge,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "kycStatus", user.getKycStatus(),
                        "badge", user.getBadge()
                )
        ));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByPhone(email).orElse(null));
    }
}
