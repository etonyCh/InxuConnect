package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    public PaymentController(PaymentRepository paymentRepository, BookingRepository bookingRepository) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
    }

    // 4. Webhook Mock InTouch : Confirmation de paiement reçu (Escrow activé)
    @PostMapping("/mock-callback")
    @Transactional
    public ResponseEntity<?> mockCallback(@RequestBody Map<String, String> body) {
        String reference = body.get("reference");
        String status = body.get("status");

        if (reference == null || status == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "reference et status sont requis"));
        }

        Optional<Payment> optionalPayment = paymentRepository.findByReference(reference);
        if (optionalPayment.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Paiement introuvable pour cette référence"));
        }

        Payment payment = optionalPayment.get();
        Booking booking = payment.getBooking();

        if (status.equalsIgnoreCase("SUCCESS")) {
            // Le paiement a réussi -> Les fonds entrent en Escrow et la réservation est CONFIRMÉE
            payment.setStatus(PaymentStatus.ESCROWED);
            booking.setStatus(BookingStatus.CONFIRMED);
            System.out.println("[ESCROW ACTIVÉ] Réservation " + booking.getId() + " confirmée. Fonds sécurisés en Escrow.");
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            booking.setStatus(BookingStatus.CANCELLED);
            System.out.println("[PAIEMENT ÉCHOUÉ] Réservation " + booking.getId() + " annulée suite à échec de collecte.");
        }

        paymentRepository.save(payment);
        bookingRepository.save(booking);

        return ResponseEntity.ok(Map.of("success", true, "message", "Statut mis à jour"));
    }
}
