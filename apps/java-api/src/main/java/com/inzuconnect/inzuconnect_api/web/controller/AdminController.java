package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final BookingRepository bookingRepository;
    private final KycRequestRepository kycRequestRepository;

    public AdminController(
            UserRepository userRepository,
            ListingRepository listingRepository,
            BookingRepository bookingRepository,
            KycRequestRepository kycRequestRepository
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.bookingRepository = bookingRepository;
        this.kycRequestRepository = kycRequestRepository;
    }

    // 1. Tableau de bord de l'Administrateur
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }
        if (currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - ADMIN requis"));
        }

        try {
            long usersCount = userRepository.count();
            long listingsCount = listingRepository.count();
            long bookingsCount = bookingRepository.count();
            long kycCount = kycRequestRepository.findAll().stream()
                    .filter(k -> k.getStatus() == KycStatus.PENDING)
                    .count();

            List<Map<String, Object>> recentUsers = userRepository.findAll().stream()
                    .sorted((u1, u2) -> u2.getCreatedAt().compareTo(u1.getCreatedAt()))
                    .limit(5)
                    .map(u -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", u.getId());
                        map.put("name", u.getName());
                        map.put("email", u.getEmail());
                        map.put("role", u.getRole().name());
                        map.put("createdAt", u.getCreatedAt());
                        return map;
                    }).collect(Collectors.toList());

            List<Map<String, Object>> pendingKyc = kycRequestRepository.findAll().stream()
                    .filter(k -> k.getStatus() == KycStatus.PENDING)
                    .sorted((k1, k2) -> k2.getCreatedAt().compareTo(k1.getCreatedAt()))
                    .limit(5)
                    .map(k -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", k.getId());
                        map.put("cniUrl", k.getCniUrl());
                        map.put("selfieUrl", k.getSelfieUrl());
                        map.put("status", k.getStatus().name());
                        map.put("createdAt", k.getCreatedAt());

                        Map<String, Object> userMap = new HashMap<>();
                        userMap.put("name", k.getUser().getName());
                        userMap.put("email", k.getUser().getEmail());
                        map.put("user", userMap);

                        return map;
                    }).collect(Collectors.toList());

            Map<String, Object> stats = new HashMap<>();
            stats.put("users", usersCount);
            stats.put("listings", listingsCount);
            stats.put("bookings", bookingsCount);
            stats.put("kycPending", kycCount);

            Map<String, Object> response = new HashMap<>();
            response.put("stats", stats);
            response.put("recentUsers", recentUsers);
            response.put("pendingKyc", pendingKyc);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Erreur lors du chargement des statistiques admin."));
        }
    }

    // 2. Revue d'un dossier KYC
    @PostMapping("/kyc/{id}/review")
    @Transactional
    public ResponseEntity<?> reviewKyc(@PathVariable String id, @RequestBody Map<String, String> body) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }
        if (currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - ADMIN requis"));
        }

        String statusStr = body.get("status");
        if (statusStr == null || (!statusStr.equalsIgnoreCase("VERIFIED") && !statusStr.equalsIgnoreCase("REJECTED"))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Status invalide (doit être VERIFIED ou REJECTED)"));
        }

        Optional<KycRequest> optionalKyc = kycRequestRepository.findById(id);
        if (optionalKyc.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "KYC introuvable"));
        }

        KycRequest kyc = optionalKyc.get();
        User user = kyc.getUser();

        KycStatus status = statusStr.equalsIgnoreCase("VERIFIED") ? KycStatus.VERIFIED : KycStatus.REJECTED;
        Badge badge = statusStr.equalsIgnoreCase("VERIFIED") ? Badge.VERIFIED : Badge.NONE;

        kyc.setStatus(status);
        kycRequestRepository.save(kyc);

        user.setKycStatus(status);
        user.setBadge(badge);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("success", true, "message", "KYC " + status.name()));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByPhone(email).orElse(null));
    }
}
