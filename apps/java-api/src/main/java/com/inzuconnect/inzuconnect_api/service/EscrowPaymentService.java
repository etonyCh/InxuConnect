package com.inzuconnect.inzuconnect_api.service;

import com.inzuconnect.inzuconnect_api.domain.Booking;
import com.inzuconnect.inzuconnect_api.domain.Payment;
import com.inzuconnect.inzuconnect_api.domain.enums.PaymentMethod;
import com.inzuconnect.inzuconnect_api.domain.enums.PaymentStatus;
import com.inzuconnect.inzuconnect_api.repository.BookingRepository;
import com.inzuconnect.inzuconnect_api.repository.PaymentRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EscrowPaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    public EscrowPaymentService(PaymentRepository paymentRepository, BookingRepository bookingRepository) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
    }

    /**
     * Initiates a Mobile Money Escrow Payment (Lumicash / EcoCash)
     */
    @Transactional
    public Payment initiateEscrowPayment(Booking booking, int amountFbu, String providerStr, String phoneNumber) {
        PaymentMethod method = PaymentMethod.ECOCASH;
        if (providerStr != null && providerStr.equalsIgnoreCase("LUMICASH")) {
            method = PaymentMethod.LUMICASH;
        }

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(amountFbu)
                .provider(method)
                .status(PaymentStatus.ESCROW_HELD)
                .reference("ESCROW-" + method + "-" + System.currentTimeMillis())
                .build();

        return paymentRepository.save(payment);
    }

    /**
     * Cron job running every hour to automatically release held funds to Host 24h post check-in.
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void processScheduledEscrowReleases() {
        List<Payment> heldPayments = paymentRepository.findByStatus(PaymentStatus.ESCROW_HELD);
        LocalDateTime now = LocalDateTime.now();

        for (Payment payment : heldPayments) {
            Booking booking = payment.getBooking();
            if (booking != null && booking.getCheckIn() != null) {
                LocalDateTime releaseTime = booking.getCheckIn().plusHours(24);
                if (now.isAfter(releaseTime)) {
                    payment.setStatus(PaymentStatus.COMPLETED);
                    paymentRepository.save(payment);
                    System.out.println("[ESCROW RELEASE] Libération de " + payment.getAmount() + " FBU à l'Hôte pour la réservation " + booking.getId());
                }
            }
        }
    }
}
