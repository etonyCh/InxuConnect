package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import com.inzuconnect.inzuconnect_api.web.dto.MessageSendDto;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings/{bookingId}/messages")
public class MessageController {

    private final MessageRepository messageRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    private static final Map<String, String> DICTIONARY = new HashMap<>();
    static {
        // Français -> Kirundi
        DICTIONARY.put("je suis en route", "ndi mu nzira");
        DICTIONARY.put("je suis en route.", "ndi mu nzira.");
        DICTIONARY.put("quelle est l'adresse exacte ?", "ni he ryerekezo ry'inzu ryiza ?");
        DICTIONARY.put("quelle est l'adresse exacte", "ni he ryerekezo ry'inzu ryiza ?");
        DICTIONARY.put("je suis arrivé", "nashitse");
        DICTIONARY.put("je suis arrivé.", "nashitse.");
        DICTIONARY.put("est-ce qu'il y a du courant ?", "umuriro urahari ?");
        DICTIONARY.put("est-ce qu'il y a du courant", "umuriro urahari ?");
        DICTIONARY.put("l'eau est coupée ?", "amazi yakutse ?");
        DICTIONARY.put("l'eau est coupée", "amazi yakutse ?");
        DICTIONARY.put("merci beaucoup", "murakoze cane");
        DICTIONARY.put("merci beaucoup.", "murakoze cane.");
        DICTIONARY.put("à quelle heure arrivez-vous ?", "mushika isaha zingahe ?");
        DICTIONARY.put("à quelle heure arrivez-vous", "mushika isaha zingahe ?");
        DICTIONARY.put("je serai là vers 18h", "ndashika nk'isaha zibiri z'umugoroba (18h)");
        DICTIONARY.put("je serai là vers 18h.", "ndashika nk'isaha zibiri z'umugoroba (18h).");

        // Kirundi -> Français
        DICTIONARY.put("ndi mu nzira", "je suis en route");
        DICTIONARY.put("ndi mu nzira.", "je suis en route.");
        DICTIONARY.put("ni he ryerekezo ry'inzu ryiza ?", "quelle est l'adresse exacte ?");
        DICTIONARY.put("ni he ryerekezo ry'inzu ryiza", "quelle est l'adresse exacte ?");
        DICTIONARY.put("nashitse", "je suis arrivé");
        DICTIONARY.put("nashitse.", "je suis arrived.");
        DICTIONARY.put("umuriro urahari ?", "est-ce qu'il y a du courant ?");
        DICTIONARY.put("umuriro urahari", "est-ce qu'il y a du courant ?");
        DICTIONARY.put("amazi yakutse ?", "l'eau est coupée ?");
        DICTIONARY.put("amazi yakutse", "l'eau est coupée ?");
        DICTIONARY.put("murakoze cane", "merci beaucoup");
        DICTIONARY.put("murakoze cane.", "merci beaucoup.");
        DICTIONARY.put("mushika isaha zingahe ?", "à quelle heure arrivez-vous ?");
        DICTIONARY.put("mushika isaha zingahe", "à quelle heure arrivez-vous ?");
        DICTIONARY.put("ndashika nk'isaha zibiri z'umugoroba (18h)", "je serai là vers 18h");
        DICTIONARY.put("ndashika nk'isaha zibiri z'umugoroba (18h).", "je serai là vers 18h.");
    }

    public MessageController(
            MessageRepository messageRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository
    ) {
        this.messageRepository = messageRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    // 1. Envoyer un message dans le chat d'une réservation (Traduction automatique intégrée)
    @PostMapping
    @Transactional
    public ResponseEntity<?> sendMessage(
            @PathVariable String bookingId,
            @Valid @RequestBody MessageSendDto dto
    ) {
        String body = dto.getContent();
        String lang = "FR";

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        Optional<Booking> optionalBooking = bookingRepository.findById(bookingId);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Réservation non trouvée"));
        }

        Booking booking = optionalBooking.get();
        boolean isGuest = booking.getGuest().getId().equals(currentUser.getId());
        boolean isHost = booking.getListing().getOwner().getId().equals(currentUser.getId());

        if (!isGuest && !isHost) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Interdit - Vous ne faites pas partie de cette réservation"));
        }

        String targetLang = lang.equalsIgnoreCase("FR") ? "RN" : "FR";
        String translatedBody = translate(body, targetLang);

        Message message = new Message();
        message.setBooking(booking);
        message.setSender(currentUser);
        message.setBodyOriginal(body);
        message.setBodyTranslated(translatedBody);
        message.setLang(lang.toUpperCase());

        message = messageRepository.save(message);

        // Simulate WhatsApp notification
        String recipientId = isGuest ? booking.getListing().getOwner().getId() : booking.getGuest().getId();
        User recipient = userRepository.findById(recipientId).orElse(null);

        System.out.println("\n==================================================");
        System.out.println("📲 [SIMULATEUR WHATSAPP] Notification push programmée...");
        System.out.println("DESTINATAIRE : " + (recipient != null ? recipient.getName() : "Inconnu") + " (" + (recipient != null && recipient.getPhone() != null ? recipient.getPhone() : "Pas de numéro") + ")");
        System.out.println("MESSAGE : Nouveau message de " + currentUser.getName() + ".");
        System.out.println("CONTENU : \"" + (body.length() > 30 ? body.substring(0, 30) + "..." : body) + "\"");
        System.out.println("👉 Notification envoyée sur WhatsApp si non lu d'ici 30 minutes.");
        System.out.println("==================================================\n");

        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }

    // 2. Récupérer l'historique des messages d'une réservation (Trié chronologiquement)
    @GetMapping
    public ResponseEntity<?> getMessages(@PathVariable String bookingId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }

        Optional<Booking> optionalBooking = bookingRepository.findById(bookingId);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Réservation non trouvée"));
        }

        Booking booking = optionalBooking.get();
        boolean isGuest = booking.getGuest().getId().equals(currentUser.getId());
        boolean isHost = booking.getListing().getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isGuest && !isHost && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Interdit - Accès non autorisé aux messages"));
        }

        List<Message> messages = messageRepository.findByBookingIdOrderByCreatedAtAsc(bookingId);
        return ResponseEntity.ok(messages);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByPhone(email).orElse(null));
    }

    private String translate(String text, String targetLang) {
        String cleanText = text.trim();
        String lowerText = cleanText.toLowerCase();

        if (DICTIONARY.containsKey(lowerText)) {
            String translation = DICTIONARY.get(lowerText);
            if (Character.isUpperCase(cleanText.charAt(0))) {
                return Character.toUpperCase(translation.charAt(0)) + translation.substring(1);
            }
            return translation;
        }

        if (targetLang.equalsIgnoreCase("RN")) {
            return "[Simulé Kirundi] " + cleanText;
        } else {
            if (cleanText.startsWith("[Simulé Kirundi] ")) {
                return cleanText.replace("[Simulé Kirundi] ", "");
            }
            return "[Simulé Français] " + cleanText;
        }
    }
}
