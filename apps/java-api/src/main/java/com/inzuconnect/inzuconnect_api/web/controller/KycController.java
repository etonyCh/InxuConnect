package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import com.inzuconnect.inzuconnect_api.security.WebhookSignatureService;
import com.inzuconnect.inzuconnect_api.web.dto.KycSubmitDto;
import com.inzuconnect.inzuconnect_api.web.dto.KycWebhookDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/kyc")
public class KycController {

    private static final String RFC_TYPE_BASE = "https://inzuconnect.bi/problem/";

    private final KycRequestRepository kycRequestRepository;
    private final UserRepository userRepository;
    private final WebhookSignatureService webhookSignatureService;

    public KycController(KycRequestRepository kycRequestRepository,
                         UserRepository userRepository,
                         WebhookSignatureService webhookSignatureService) {
        this.kycRequestRepository = kycRequestRepository;
        this.userRepository = userRepository;
        this.webhookSignatureService = webhookSignatureService;
    }

    @PostMapping("/submit")
    @Transactional
    public ResponseEntity<?> submitKyc(@Valid @RequestBody KycSubmitDto dto) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<KycRequest> optionalKyc = kycRequestRepository.findByUserId(currentUser.getId());
        KycRequest kycRequest;

        if (optionalKyc.isPresent()) {
            kycRequest = optionalKyc.get();
            kycRequest.setCniUrl(dto.getCniUrl());
            kycRequest.setSelfieUrl(dto.getSelfieUrl());
            kycRequest.setStatus(KycStatus.PENDING);
        } else {
            kycRequest = new KycRequest();
            kycRequest.setUser(currentUser);
            kycRequest.setCniUrl(dto.getCniUrl());
            kycRequest.setSelfieUrl(dto.getSelfieUrl());
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

    @PostMapping("/webhook")
    @Transactional
    public ResponseEntity<?> kycWebhook(@RequestHeader("X-Signature") String signatureHeader,
                                        @Valid @RequestBody KycWebhookDto dto,
                                        HttpServletRequest request) {
        String rawPayload = extractRawPayload(request);
        if (!webhookSignatureService.verifyHmacSha256(rawPayload, signatureHeader)) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                    HttpStatus.FORBIDDEN,
                    "Signature HMAC invalide ou absente."
            );
            detail.setType(URI.create(RFC_TYPE_BASE + "invalid-signature"));
            detail.setTitle("Signature invalide");
            detail.setInstance(URI.create(request.getRequestURI()));
            detail.setProperty("timestamp", Instant.now());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(detail);
        }

        Optional<User> optionalUser = userRepository.findById(dto.getUserId());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Utilisateur introuvable"));
        }

        User user = optionalUser.get();
        Optional<KycRequest> optionalKyc = kycRequestRepository.findByUserId(dto.getUserId());
        if (optionalKyc.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Demande KYC introuvable"));
        }

        KycRequest kycRequest = optionalKyc.get();

        KycStatus status = "APPROVED".equals(dto.getResult()) ? KycStatus.VERIFIED : KycStatus.REJECTED;
        Badge badge = "APPROVED".equals(dto.getResult()) ? Badge.VERIFIED : Badge.NONE;

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

    private String extractRawPayload(HttpServletRequest request) {
        if (request instanceof ContentCachingRequestWrapper wrapper) {
            byte[] buf = wrapper.getContentAsByteArray();
            if (buf.length > 0) {
                return new String(buf, StandardCharsets.UTF_8);
            }
        }
        return "";
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByPhone(email).orElse(null));
    }
}
