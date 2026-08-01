package com.inzuconnect.inzuconnect_api.repository;

import com.inzuconnect.inzuconnect_api.domain.Payment;
import com.inzuconnect.inzuconnect_api.domain.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    Optional<Payment> findByReference(String reference);
    Optional<Payment> findByBookingId(String bookingId);
    List<Payment> findByStatus(PaymentStatus status);
}
