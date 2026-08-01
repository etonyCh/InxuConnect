package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.KycRequest;
import com.inzuconnect.inzuconnect_api.domain.User;
import com.inzuconnect.inzuconnect_api.domain.enums.Badge;
import com.inzuconnect.inzuconnect_api.domain.enums.KycStatus;
import com.inzuconnect.inzuconnect_api.repository.KycRequestRepository;
import com.inzuconnect.inzuconnect_api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/admin/kyc")
public class AdminKycController {

    private final KycRequestRepository kycRequestRepository;
    private final UserRepository userRepository;

    public AdminKycController(KycRequestRepository kycRequestRepository, UserRepository userRepository) {
        this.kycRequestRepository = kycRequestRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<KycRequest>> getPendingRequests() {
        return ResponseEntity.ok(kycRequestRepository.findByStatus(KycStatus.PENDING));
    }

    @PostMapping("/{requestId}/approve")
    @Transactional
    public ResponseEntity<?> approveKycRequest(@PathVariable String requestId) {
        Optional<KycRequest> optional = kycRequestRepository.findById(requestId);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        KycRequest request = optional.get();
        request.setStatus(KycStatus.VERIFIED);
        kycRequestRepository.save(request);

        User user = request.getUser();
        if (user != null) {
            user.setKycStatus(KycStatus.VERIFIED);
            user.setBadge(Badge.VERIFIED);
            userRepository.save(user);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Identité vérifiée avec succès. Badge VERIFIED attribué à " + (user != null ? user.getName() : "l'utilisateur")
        ));
    }

    @PostMapping("/{requestId}/reject")
    @Transactional
    public ResponseEntity<?> rejectKycRequest(@PathVariable String requestId, @RequestBody Map<String, String> body) {
        Optional<KycRequest> optional = kycRequestRepository.findById(requestId);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        KycRequest request = optional.get();
        request.setStatus(KycStatus.REJECTED);
        kycRequestRepository.save(request);

        User user = request.getUser();
        if (user != null) {
            user.setKycStatus(KycStatus.REJECTED);
            userRepository.save(user);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Demande KYC rejetée."
        ));
    }
}
