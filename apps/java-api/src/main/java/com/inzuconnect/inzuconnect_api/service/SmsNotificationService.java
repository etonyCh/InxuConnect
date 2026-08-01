package com.inzuconnect.inzuconnect_api.service;

import org.springframework.stereotype.Service;

@Service
public class SmsNotificationService {

    /**
     * Sends SMS to Burundi mobile phone numbers (+257)
     */
    public boolean sendSms(String phoneNumber, String messageContent) {
        String formattedPhone = formatBurundiPhone(phoneNumber);
        System.out.println("[SMS SENT to " + formattedPhone + "]: " + messageContent);
        return true;
    }

    public void sendBookingConfirmationSms(String phoneNumber, String listingTitle, String dates, int totalFbu) {
        String msg = "InzuConnect: Votre réservation pour '" + listingTitle + "' (" + dates + ") de " +
                String.format("%,d", totalFbu) + " FBU a été confirmée. Fonds placés en séquestre Mobile Money.";
        sendSms(phoneNumber, msg);
    }

    public void sendHostNewBookingSms(String hostPhone, String guestName, String listingTitle) {
        String msg = "InzuConnect: Nouvelle réservation de " + guestName + " pour votre logement '" + listingTitle + "'. Connectez-vous pour voir les détails.";
        sendSms(hostPhone, msg);
    }

    private String formatBurundiPhone(String phone) {
        if (phone == null) return "+257 70 000 000";
        if (!phone.startsWith("+")) {
            return "+257 " + phone;
        }
        return phone;
    }
}
