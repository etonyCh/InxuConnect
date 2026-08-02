package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import com.inzuconnect.inzuconnect_api.web.dto.AdminKycReviewDto;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
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

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }
        if (currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - ADMIN requis"));
        }

        long usersCount = userRepository.count();
        long listingsCount = listingRepository.count();
        long bookingsCount = bookingRepository.count();
        long kycCount = kycRequestRepository.countByStatus(KycStatus.PENDING);

        List<User> recentUsers = userRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5)).getContent();

        List<Map<String, Object>> recentUsersMap = recentUsers.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("role", u.getRole().name());
            map.put("createdAt", u.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        List<KycRequest> pendingKyc = kycRequestRepository.findByStatusOrderByCreatedAtDesc(KycStatus.PENDING);
        int pendingLimit = 5;
        if (pendingKyc.size() > pendingLimit) {
            pendingKyc = pendingKyc.subList(0, pendingLimit);
        }

        List<Map<String, Object>> pendingKycMap = pendingKyc.stream().map(k -> {
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
        response.put("recentUsers", recentUsersMap);
        response.put("pendingKyc", pendingKycMap);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/kyc/{id}/review")
    @Transactional
    public ResponseEntity<?> reviewKyc(@PathVariable String id, @Valid @RequestBody AdminKycReviewDto dto) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }
        if (currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - ADMIN requis"));
        }

        Optional<KycRequest> optionalKyc = kycRequestRepository.findById(id);
        if (optionalKyc.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "KYC introuvable"));
        }

        KycRequest kyc = optionalKyc.get();
        User user = kyc.getUser();

        KycStatus status = KycStatus.valueOf(dto.getStatus());
        Badge badge = status == KycStatus.VERIFIED ? Badge.VERIFIED : Badge.NONE;

        kyc.setStatus(status);
        kycRequestRepository.save(kyc);

        user.setKycStatus(status);
        user.setBadge(badge);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("success", true, "message", "KYC " + status.name()));
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
