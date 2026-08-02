package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import com.inzuconnect.inzuconnect_api.security.WebhookSignatureService;
import com.inzuconnect.inzuconnect_api.web.dto.PaymentWebhookDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final String RFC_TYPE_BASE = "https://inzuconnect.bi/problem/";

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final WebhookSignatureService webhookSignatureService;

    public PaymentController(PaymentRepository paymentRepository,
                             BookingRepository bookingRepository,
                             WebhookSignatureService webhookSignatureService) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.webhookSignatureService = webhookSignatureService;
    }

    @PostMapping("/mock-callback")
    @Transactional
    public ResponseEntity<?> mockCallback(@RequestHeader("X-Signature") String signatureHeader,
                                          @Valid @RequestBody PaymentWebhookDto dto,
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

        Optional<Payment> optionalPayment = paymentRepository.findByReference(dto.getReference());
        if (optionalPayment.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Paiement introuvable pour cette référence"));
        }

        Payment payment = optionalPayment.get();
        Booking booking = payment.getBooking();

        if ("SUCCESS".equals(dto.getStatus())) {
            payment.setStatus(PaymentStatus.ESCROWED);
            booking.setStatus(BookingStatus.CONFIRMED);
            System.out.println("[ESCROW ACTIVÉ] Réservation " + booking.getId() + " confirmée. Fonds sécurisés en Escrow.");
        } else if ("PENDING".equals(dto.getStatus())) {
            payment.setStatus(PaymentStatus.PENDING);
            System.out.println("[PAIEMENT EN ATTENTE] Réservation " + booking.getId() + " en attente de confirmation.");
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            booking.setStatus(BookingStatus.CANCELLED);
            System.out.println("[PAIEMENT ÉCHOUÉ] Réservation " + booking.getId() + " annulée suite à échec de collecte.");
        }

        paymentRepository.save(payment);
        bookingRepository.save(booking);

        return ResponseEntity.ok(Map.of("success", true, "message", "Statut mis à jour"));
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
}
