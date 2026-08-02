package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.service.SmsNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/sms")
public class OfflineSmsController {

    private final SmsNotificationService smsNotificationService;

    public OfflineSmsController(SmsNotificationService smsNotificationService) {
        this.smsNotificationService = smsNotificationService;
    }

    /**
     * Webhook for receiving SMS responses ("1" = Accept, "2" = Reject) from rural hosts in Burundi without 3G/4G.
     */
    @PostMapping("/incoming")
    public ResponseEntity<?> handleIncomingHostSms(@RequestBody Map<String, String> payload) {
        String fromPhone = payload.get("from");
        String messageBody = payload.get("text");

        if (messageBody != null && messageBody.trim().equals("1")) {
            System.out.println("[SMS OFFLINE HOST] Réservation ACCEPTÉE par l'hôte " + fromPhone);
            smsNotificationService.sendSms(fromPhone, "InzuConnect: Merci ! La réservation est confirmée. Les fonds sont en séquestre Lumicash/EcoCash.");
            return ResponseEntity.ok(Map.of("status", "CONFIRMED", "message", "Réservation confirmée via SMS"));
        } else if (messageBody != null && messageBody.trim().equals("2")) {
            System.out.println("[SMS OFFLINE HOST] Réservation REFUSÉE par l'hôte " + fromPhone);
            smsNotificationService.sendSms(fromPhone, "InzuConnect: Réservation annulée. Le voyageur a été remboursé.");
            return ResponseEntity.ok(Map.of("status", "REJECTED", "message", "Réservation annulée via SMS"));
        }

        return ResponseEntity.badRequest().body(Map.of("error", "Format SMS invalide. Répondez 1 pour ACCEPTER ou 2 pour REFUSER."));
    }
}
