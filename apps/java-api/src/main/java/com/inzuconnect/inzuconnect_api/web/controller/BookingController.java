package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import com.inzuconnect.inzuconnect_api.web.dto.BookingCreateDto;
import com.inzuconnect.inzuconnect_api.web.dto.BookingSosDto;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final ServiceBookingRepository serviceBookingRepository;
    private final AgentCommissionRepository agentCommissionRepository;

    public BookingController(
            BookingRepository bookingRepository,
            ListingRepository listingRepository,
            UserRepository userRepository,
            PaymentRepository paymentRepository,
            ServiceItemRepository serviceItemRepository,
            ServiceBookingRepository serviceBookingRepository,
            AgentCommissionRepository agentCommissionRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.serviceBookingRepository = serviceBookingRepository;
        this.agentCommissionRepository = agentCommissionRepository;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingCreateDto dto) {
        User currentGuest = getCurrentUser();
        if (currentGuest == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<Listing> optionalListing = listingRepository.findById(dto.getListingId());
        if (optionalListing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Logement introuvable."));
        }

        Listing listing = optionalListing.get();

        B2bCompany b2bCompany = currentGuest.getB2bCompany();
        if (b2bCompany != null) {
            if (listing.getPrice() > b2bCompany.getMaxPricePerNight()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error",
                        "Politique de voyage enfreinte : Le prix de ce logement (" + String.format("%,d", listing.getPrice()) +
                        " BIF/nuit) dépasse la limite autorisée par votre entreprise (" + String.format("%,d", b2bCompany.getMaxPricePerNight()) + " BIF/nuit)."));
            }
        }

        String ci = dto.getCheckIn();
        String co = dto.getCheckOut();
        LocalDateTime checkIn = LocalDateTime.parse(ci.contains("T") ? ci : ci + "T00:00:00");
        LocalDateTime checkOut = LocalDateTime.parse(co.contains("T") ? co : co + "T00:00:00");

        Booking booking = new Booking();
        booking.setListing(listing);
        booking.setGuest(currentGuest);
        booking.setCheckIn(checkIn);
        booking.setCheckOut(checkOut);
        booking.setTotalPrice(dto.getTotalPrice());
        booking.setStatus(BookingStatus.PENDING);
        booking.setB2bCompany(b2bCompany);

        booking = bookingRepository.save(booking);

        List<ServiceBooking> serviceBookings = new ArrayList<>();
        if (dto.getServiceItemIds() != null) {
            for (String itemId : dto.getServiceItemIds()) {
                Optional<ServiceItem> item = serviceItemRepository.findById(itemId);
                if (item.isPresent()) {
                    ServiceBooking sb = new ServiceBooking();
                    sb.setBooking(booking);
                    sb.setServiceItem(item.get());
                    sb.setStatus("PENDING");
                    serviceBookingRepository.save(sb);
                    serviceBookings.add(sb);
                }
            }
        }

        String uniqueRef = "INT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        PaymentMethod paymentMethod = dto.getPaymentMethod();

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setProvider(paymentMethod);
        payment.setReference(uniqueRef);
        payment.setAmount(dto.getTotalPrice());
        payment.setStatus(PaymentStatus.PENDING);

        payment = paymentRepository.save(payment);

        Map<String, Object> res = new HashMap<>();
        res.put("id", booking.getId());
        res.put("listingId", listing.getId());
        res.put("guestId", currentGuest.getId());
        res.put("checkIn", booking.getCheckIn());
        res.put("checkOut", booking.getCheckOut());
        res.put("totalPrice", booking.getTotalPrice());
        res.put("status", booking.getStatus());
        res.put("payment", payment);

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserBookings(@PathVariable String userId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        boolean isSelf = currentUser.getId().equals(userId);
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isB2bManager = currentUser.getRole() == Role.B2B
                && currentUser.getB2bCompany() != null
                && userId != null;

        List<Booking> bookings;
        if (isAdmin) {
            bookings = bookingRepository.findByGuestIdOrListingOwnerId(userId);
        } else if (isB2bManager) {
            Optional<User> targetOpt = userRepository.findById(userId);
            if (targetOpt.isEmpty()
                    || targetOpt.get().getB2bCompany() == null
                    || !targetOpt.get().getB2bCompany().getId().equals(currentUser.getB2bCompany().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Interdit - cet utilisateur est hors périmètre de votre entreprise."));
            }
            bookings = bookingRepository.findByGuestIdOrListingOwnerId(userId);
        } else if (isSelf) {
            bookings = bookingRepository.findByGuestIdOrListingOwnerId(currentUser.getId());
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Interdit - Vous n'êtes pas autorisé à accéder aux réservations de cet utilisateur"));
        }

        List<Map<String, Object>> resList = bookings.stream().map(b -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", b.getId());
            map.put("checkIn", b.getCheckIn());
            map.put("checkOut", b.getCheckOut());
            map.put("totalPrice", b.getTotalPrice());
            map.put("status", b.getStatus());
            map.put("createdAt", b.getCreatedAt());

            Map<String, Object> listingMap = new HashMap<>();
            listingMap.put("id", b.getListing().getId());
            listingMap.put("title", b.getListing().getTitle());
            listingMap.put("price", b.getListing().getPrice());
            listingMap.put("city", b.getListing().getCity());
            listingMap.put("photos", b.getListing().getPhotos());
            map.put("listing", listingMap);

            Optional<Payment> payment = paymentRepository.findByBookingId(b.getId());
            map.put("payment", payment.orElse(null));
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(resList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingDetails(@PathVariable String id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Réservation non trouvée"));
        }

        Booking booking = optionalBooking.get();
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isScoped;
        if (isAdmin) {
            isScoped = true;
        } else {
            isScoped = bookingRepository.countAccessible(currentUser.getId(), booking.getId()) > 0;
        }

        if (!isScoped) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit à cette réservation"));
        }

        Optional<Payment> payment = paymentRepository.findByBookingId(booking.getId());

        Map<String, Object> res = new HashMap<>();
        res.put("id", booking.getId());
        res.put("checkIn", booking.getCheckIn());
        res.put("checkOut", booking.getCheckOut());
        res.put("totalPrice", booking.getTotalPrice());
        res.put("status", booking.getStatus());
        res.put("createdAt", booking.getCreatedAt());
        res.put("payment", payment.orElse(null));

        Map<String, Object> guestMap = new HashMap<>();
        guestMap.put("id", booking.getGuest().getId());
        guestMap.put("name", booking.getGuest().getName());
        guestMap.put("phone", booking.getGuest().getPhone());
        res.put("guest", guestMap);

        Map<String, Object> listingMap = new HashMap<>();
        listingMap.put("id", booking.getListing().getId());
        listingMap.put("title", booking.getListing().getTitle());
        listingMap.put("price", booking.getListing().getPrice());
        listingMap.put("city", booking.getListing().getCity());
        listingMap.put("ownerId", booking.getListing().getOwner().getId());
        res.put("listing", listingMap);

        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/check-in")
    @Transactional
    public ResponseEntity<?> checkIn(@PathVariable String id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Réservation non trouvée"));
        }

        Booking booking = optionalBooking.get();

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isOwner = bookingRepository.countOwnedByHost(currentUser.getId(), booking.getId()) > 0;
        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Non autorisé. Seul l'hôte propriétaire de ce logement peut valider l'arrivée."));
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Statut de réservation invalide pour le check-in: " + booking.getStatus() + " (attendu: CONFIRMED)"));
        }

        Optional<Payment> optionalPayment = paymentRepository.findByBookingId(booking.getId());
        if (optionalPayment.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Paiement associé introuvable"));
        }

        Payment payment = optionalPayment.get();
        booking.setStatus(BookingStatus.CHECKED_IN);
        payment.setStatus(PaymentStatus.PAID_OUT);
        payment.setPayoutAt(LocalDateTime.now());

        bookingRepository.save(booking);
        paymentRepository.save(payment);

        User owner = booking.getListing().getOwner();
        String agentId = owner.getReferredByAgentId();
        int agentCommissionAmount = 0;
        if (agentId != null) {
            agentCommissionAmount = (int) Math.floor(booking.getTotalPrice() * 0.05);
            AgentCommission commission = new AgentCommission();
            commission.setAgentId(agentId);
            commission.setBookingId(booking.getId());
            commission.setAmount(agentCommissionAmount);
            agentCommissionRepository.save(commission);
        }

        int savingsAmount = 0;
        if (owner.isMicroSavingsEnabled()) {
            int ownerShare = booking.getTotalPrice() - agentCommissionAmount;
            savingsAmount = (int) Math.floor(ownerShare * 0.10);
            owner.setSavingsBalance(owner.getSavingsBalance() + savingsAmount);
            userRepository.save(owner);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Check-in validé et reversement des fonds hôte effectué",
                "bookingId", booking.getId()
        ));
    }

    @PostMapping("/{id}/sos")
    public ResponseEntity<?> triggerSos(
            @PathVariable String id,
            @Valid @RequestBody BookingSosDto dto
    ) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Réservation non trouvée."));
        }

        Booking booking = optionalBooking.get();

        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Vous ne pouvez pas déclencher d'alerte SOS pour une réservation au statut : " + booking.getStatus() + ". Le séjour doit être actif (CHECKED_IN)."));
        }

        boolean isGuest = booking.getGuest().getId().equals(currentUser.getId());
        boolean isHost = booking.getListing().getOwner().getId().equals(currentUser.getId());

        if (!isGuest && !isHost) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Vous n'êtes pas autorisé à déclencher un SOS pour cette réservation."));
        }

        String senderName = isGuest ? booking.getGuest().getName() : booking.getListing().getOwner().getName();
        String receiverPhone = isGuest ? booking.getListing().getOwner().getPhone() : booking.getGuest().getPhone();
        String roleLabel = isGuest ? "le voyageur" : "l'hôte";

        if (receiverPhone == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Le numéro de téléphone du destinataire est manquant."));
        }

        String gpsDetails = "";
        if (dto.getLatitude() != null && dto.getLongitude() != null) {
            gpsDetails = "\nPosition GPS actuelle : https://www.google.com/maps?q=" + dto.getLatitude() + "," + dto.getLongitude();
        }

        String shortRef = booking.getId().length() >= 8 ? booking.getId().substring(0, 8) : booking.getId();
        String message = "🚨 [INZUCONNECT - SOS URGENCE] 🚨\nUne alerte de sécurité a été déclenchée par " + senderName + " (" + roleLabel + ") pour la réservation du logement \"" + booking.getListing().getTitle() + "\" (Réf: #" + shortRef + ")." + gpsDetails + "\nVeuillez le contacter immédiatement ou alerter les secours localement.";

        return ResponseEntity.ok(Map.of("success", true, "message", "Alerte SOS transmise avec succès aux services et à l'autre participant."));
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
