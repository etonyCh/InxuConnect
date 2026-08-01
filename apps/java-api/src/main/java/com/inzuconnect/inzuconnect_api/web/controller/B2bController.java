package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import jakarta.transaction.Transactional;
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

    // 1. Enregistrer une nouvelle entreprise B2B (et y lier le créateur)
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> registerCompany(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String tier = body.get("tier");

        if (name == null || tier == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Les champs 'name' et 'tier' (PME ou ONG_INTERNATIONALE) sont requis."));
        }

        if (!tier.equals("PME") && !tier.equals("ONG_INTERNATIONALE")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Le niveau d'abonnement 'tier' doit être 'PME' ou 'ONG_INTERNATIONALE'."));
        }

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        int saasFee = tier.equals("PME") ? 50000 : 200000;

        B2bCompany company = new B2bCompany();
        company.setName(name);
        company.setTier(tier);
        company.setSaasFee(saasFee);
        company.setMaxPricePerNight(100000); // 100,000 BIF default limit

        company = b2bCompanyRepository.save(company);

        currentUser.setB2bCompany(company);
        userRepository.save(currentUser);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Entreprise B2B enregistrée et liée à votre profil avec succès.",
                "company", company,
                "user", Map.of(
                        "id", currentUser.getId(),
                        "name", currentUser.getName(),
                        "email", currentUser.getEmail(),
                        "b2bCompanyId", company.getId()
                )
        ));
    }

    // 2. Inviter un employé à rejoindre l'entreprise B2B
    @PostMapping("/invite")
    @Transactional
    public ResponseEntity<?> inviteEmployee(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String phone = body.get("phone");

        if (email == null && phone == null) {
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

        Optional<User> targetUserOpt = Optional.empty();
        if (email != null) {
            targetUserOpt = userRepository.findByEmail(email.toLowerCase());
        }
        if (targetUserOpt.isEmpty() && phone != null) {
            targetUserOpt = userRepository.findByPhone(phone);
        }

        if (targetUserOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Utilisateur introuvable avec ces coordonnées."));
        }

        User targetUser = targetUserOpt.get();
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

    // 3. Configurer la politique de voyage
    @PatchMapping("/policy")
    @Transactional
    public ResponseEntity<?> updatePolicy(@RequestBody Map<String, Object> body) {
        Object maxPriceObj = body.get("maxPricePerNight");
        if (maxPriceObj == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Le paramètre 'maxPricePerNight' doit être fourni."));
        }

        int maxPrice = ((Number) maxPriceObj).intValue();

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        B2bCompany company = currentUser.getB2bCompany();
        if (company == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit - Votre compte n'est lié à aucune entreprise B2B."));
        }

        company.setMaxPricePerNight(maxPrice);
        b2bCompanyRepository.save(company);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Politique de voyage mise à jour avec succès.",
                "company", company
        ));
    }

    // 4. Tableau de bord B2B
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

        // Get employees
        List<User> employees = userRepository.findAll().stream()
                .filter(u -> u.getB2bCompany() != null && u.getB2bCompany().getId().equals(company.getId()))
                .collect(Collectors.toList());

        List<Map<String, Object>> employeesList = employees.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("phone", u.getPhone());
            m.put("role", u.getRole().name());
            return m;
        }).collect(Collectors.toList());

        // Get team bookings
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getB2bCompany() != null && b.getB2bCompany().getId().equals(company.getId()))
                .sorted((b1, b2) -> b2.getCreatedAt().compareTo(b1.getCreatedAt()))
                .collect(Collectors.toList());

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

        // Billing calculations
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
        response.put("company", company);
        response.put("employees", employeesList);
        response.put("employeesCount", employeesList.size());
        response.put("bookings", bookingsList);
        response.put("billingSummary", billingSummary);

        return ResponseEntity.ok(response);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByPhone(email).orElse(null));
    }
}
