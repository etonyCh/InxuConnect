package com.inzuconnect.inzuconnect_api.repository;

import com.inzuconnect.inzuconnect_api.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByBookingId(String bookingId);
    Optional<Review> findByBookingIdAndAuthorId(String bookingId, String authorId);
    List<Review> findByTargetIdAndRevealedAtIsNotNull(String targetId);
    List<Review> findByTargetIdAndRevealedAtIsNotNullOrderByCreatedAtDesc(String targetId);
}
