package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import com.inzuconnect.inzuconnect_api.web.dto.B2bInviteDto;
import com.inzuconnect.inzuconnect_api.web.dto.B2bPolicyDto;
import com.inzuconnect.inzuconnect_api.web.dto.B2bRegisterDto;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/b2b")
public class B2bController {

    private final B2bCompanyRepository b2bCompanyRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public B2bController(
            B2bCompanyRepository b2bCompanyRepository,
            UserRepository userRepository,
            BookingRepository bookingRepository
    ) {
        this.b2bCompanyRepository = b2bCompanyRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> registerCompany(@Valid @RequestBody B2bRegisterDto dto) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        int saasFee = "PME".equals(dto.getTier()) ? 50000 : 200000;

        B2bCompany company = new B2bCompany();
        company.setName(dto.getName());
        company.setTier(dto.getTier());
        company.setSaasFee(saasFee);
        company.setMaxPricePerNight(100000);

        company = b2bCompanyRepository.save(company);

        currentUser.setB2bCompany(company);
        if (currentUser.getRole() != Role.ADMIN) {
            currentUser.setRole(Role.B2B);
        }
        userRepository.save(currentUser);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Entreprise B2B enregistrée et liée à votre profil avec succès.",
                "company", Map.of("id", company.getId(), "name", company.getName(),
                                  "tier", company.getTier(), "saasFee", company.getSaasFee(),
                                  "maxPricePerNight", company.getMaxPricePerNight()),
                "user", Map.of(
                        "id", currentUser.getId(),
                        "name", currentUser.getName(),
                        "email", currentUser.getEmail(),
                        "role", currentUser.getRole().name(),
                        "b2bCompanyId", company.getId()
                )
        ));
    }

    @PostMapping("/invite")
    @Transactional
    public ResponseEntity<?> inviteEmployee(@Valid @RequestBody B2bInviteDto dto) {
        if (dto.getEmail() == null && dto.getPhone() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Veuillez spécifier l'adresse email ou le numéro de téléphone de l'employé."));
        }

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        B2bCompany company = currentUser.getB2bCompany();
        if (company == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - Votre compte n'est lié à aucune entreprise B2B."));
        }

        Optional<User> targetOpt = Optional.empty();
        if (dto.getEmail() != null) {
            targetOpt = userRepository.findByEmail(dto.getEmail().toLowerCase());
        }
        if (targetOpt.isEmpty() && dto.getPhone() != null) {
            targetOpt = userRepository.findByPhone(dto.getPhone());
        }

        if (targetOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Utilisateur introuvable avec ces coordonnées."));
        }

        User targetUser = targetOpt.get();
        if (targetUser.getB2bCompany() != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Cet utilisateur appartient déjà à une entreprise B2B."));
        }

        targetUser.setB2bCompany(company);
        userRepository.save(targetUser);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "L'employé " + targetUser.getName() + " a été rattaché à votre entreprise avec succès.",
                "user", Map.of(
                        "id", targetUser.getId(),
                        "name", targetUser.getName(),
                        "email", targetUser.getEmail(),
                        "phone", targetUser.getPhone(),
                        "b2bCompanyId", company.getId()
                )
        ));
    }

    @PatchMapping("/policy")
    @Transactional
    public ResponseEntity<?> updatePolicy(@Valid @RequestBody B2bPolicyDto dto) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        B2bCompany company = currentUser.getB2bCompany();
        if (company == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - Votre compte n'est lié à aucune entreprise B2B."));
        }

        company.setMaxPricePerNight(dto.getMaxPricePerNight());
        b2bCompanyRepository.save(company);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Politique de voyage mise à jour avec succès.",
                "company", Map.of("id", company.getId(),
                                  "maxPricePerNight", company.getMaxPricePerNight())
        ));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        B2bCompany company = currentUser.getB2bCompany();
        if (company == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - Votre compte n'est lié à aucune entreprise B2B."));
        }

        List<User> employees = userRepository.findByB2bCompanyId(company.getId());

        List<Map<String, Object>> employeesList = employees.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("phone", u.getPhone());
            m.put("role", u.getRole().name());
            return m;
        }).collect(Collectors.toList());

        List<Booking> bookings = bookingRepository.findByB2bCompanyId(company.getId());

        List<Map<String, Object>> bookingsList = bookings.stream().map(b -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", b.getId());
            m.put("checkIn", b.getCheckIn());
            m.put("checkOut", b.getCheckOut());
            m.put("totalPrice", b.getTotalPrice());
            m.put("status", b.getStatus().name());

            Map<String, Object> guestMap = new HashMap<>();
            guestMap.put("id", b.getGuest().getId());
            guestMap.put("name", b.getGuest().getName());
            guestMap.put("email", b.getGuest().getEmail());
            m.put("guest", guestMap);

            Map<String, Object> listingMap = new HashMap<>();
            listingMap.put("id", b.getListing().getId());
            listingMap.put("title", b.getListing().getTitle());
            listingMap.put("price", b.getListing().getPrice());
            listingMap.put("city", b.getListing().getCity());
            m.put("listing", listingMap);
            return m;
        }).collect(Collectors.toList());

        List<Booking> activeBookings = bookings.stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .collect(Collectors.toList());
        int totalBookingsAmount = activeBookings.stream().mapToInt(Booking::getTotalPrice).sum();
        int totalInvoiceAmount = totalBookingsAmount + company.getSaasFee();

        Map<String, Object> billingSummary = new HashMap<>();
        billingSummary.put("saasFee", company.getSaasFee());
        billingSummary.put("bookingsCount", activeBookings.size());
        billingSummary.put("bookingsTotalAmount", totalBookingsAmount);
        billingSummary.put("totalInvoiceAmount", totalInvoiceAmount);

        Map<String, Object> response = new HashMap<>();
        response.put("company", Map.of("id", company.getId(),
                                       "name", company.getName(),
                                       "tier", company.getTier(),
                                       "saasFee", company.getSaasFee(),
                                       "maxPricePerNight", company.getMaxPricePerNight()));
        response.put("employees", employeesList);
        response.put("employeesCount", employeesList.size());
        response.put("bookings", bookingsList);
        response.put("billingSummary", billingSummary);

        return ResponseEntity.ok(response);
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
