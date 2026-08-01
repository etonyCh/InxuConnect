package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.Booking;
import com.inzuconnect.inzuconnect_api.domain.Review;
import com.inzuconnect.inzuconnect_api.domain.User;
import com.inzuconnect.inzuconnect_api.domain.enums.Badge;
import com.inzuconnect.inzuconnect_api.domain.enums.BookingStatus;
import com.inzuconnect.inzuconnect_api.domain.enums.KycStatus;
import com.inzuconnect.inzuconnect_api.domain.enums.Role;
import com.inzuconnect.inzuconnect_api.repository.BookingRepository;
import com.inzuconnect.inzuconnect_api.repository.ReviewRepository;
import com.inzuconnect.inzuconnect_api.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public ReviewController(
            ReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    // 1. Soumettre un avis pour une réservation (Double-blind)
    @PostMapping("/api/bookings/{id}/reviews")
    @Transactional
    public ResponseEntity<?> submitReview(
            @PathVariable String id,
            @RequestBody Map<String, Object> body
    ) {
        Number ratingNum = (Number) body.get("rating");
        String comment = (String) body.get("comment");

        if (ratingNum == null || comment == null || ratingNum.intValue() < 1 || ratingNum.intValue() > 5 || comment.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "La note (1-5) et le commentaire sont requis."));
        }

        int rating = ratingNum.intValue();

        User author = getCurrentUser();
        if (author == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Réservation non trouvée."));
        }

        Booking booking = optionalBooking.get();

        // Vérifier le statut de la réservation
        if (booking.getStatus() != BookingStatus.CHECKED_IN && booking.getStatus() != BookingStatus.COMPLETED) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", 
                    "Vous ne pouvez pas évaluer cette réservation tant qu'elle n'est pas arrivée (statut actuel: " + booking.getStatus() + ")"));
        }

        // Vérifier le rôle de l'auteur de l'avis
        boolean isGuest = booking.getGuest().getId().equals(author.getId());
        boolean isHost = booking.getListing().getOwner().getId().equals(author.getId());

        if (!isGuest && !isHost) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Vous ne faites pas partie de cette réservation."));
        }

        // Déterminer la cible de l'avis
        User target = isGuest ? booking.getListing().getOwner() : booking.getGuest();

        // Vérifier si cet utilisateur a déjà soumis un avis pour cette réservation
        Optional<Review> existingReviewOpt = reviewRepository.findByBookingIdAndAuthorId(id, author.getId());
        if (existingReviewOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Vous avez déjà évalué cette réservation."));
        }

        // Vérifier si le counterpart a déjà écrit un avis
        Optional<Review> counterpartReviewOpt = reviewRepository.findByBookingIdAndAuthorId(id, target.getId());

        LocalDateTime revealedAt = null;
        Review newReview;

        if (counterpartReviewOpt.isPresent()) {
            // Les deux avis sont maintenant soumis ! Révéler les deux avis.
            revealedAt = LocalDateTime.now();

            Review counterpartReview = counterpartReviewOpt.get();
            counterpartReview.setRevealedAt(revealedAt);
            reviewRepository.save(counterpartReview);

            newReview = new Review();
            newReview.setBooking(booking);
            newReview.setAuthor(author);
            newReview.setTarget(target);
            newReview.setRating(rating);
            newReview.setComment(comment);
            newReview.setRevealedAt(revealedAt);
            newReview = reviewRepository.save(newReview);

            // Recalculer les moyennes et badges pour l'auteur et la cible
            updateSelfReputationAndBadge(author.getId());
            updateSelfReputationAndBadge(target.getId());
        } else {
            // Seul l'auteur actuel a soumis son avis, garder masqué
            newReview = new Review();
            newReview.setBooking(booking);
            newReview.setAuthor(author);
            newReview.setTarget(target);
            newReview.setRating(rating);
            newReview.setComment(comment);
            newReview.setRevealedAt(null);
            newReview = reviewRepository.save(newReview);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", revealedAt != null
                ? "Avis soumis et révélé car les deux parties ont évalué !"
                : "Avis soumis. Il restera masqué jusqu'à ce que l'autre partie soumette le sien.");
        
        Map<String, Object> reviewMap = new HashMap<>();
        reviewMap.put("id", newReview.getId());
        reviewMap.put("bookingId", newReview.getBooking().getId());
        reviewMap.put("authorId", newReview.getAuthor().getId());
        reviewMap.put("targetId", newReview.getTarget().getId());
        reviewMap.put("rating", newReview.getRating());
        reviewMap.put("comment", newReview.getComment());
        reviewMap.put("revealedAt", newReview.getRevealedAt());
        reviewMap.put("createdAt", newReview.getCreatedAt());

        response.put("review", reviewMap);
        response.put("revealed", revealedAt != null);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 2. Récupérer les avis d'une réservation (Double-blind mask)
    @GetMapping("/api/bookings/{id}/reviews")
    public ResponseEntity<?> getBookingReviews(@PathVariable String id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Réservation non trouvée."));
        }

        Booking booking = optionalBooking.get();

        // Vérifier si l'utilisateur fait partie de la réservation ou est admin
        boolean isGuest = booking.getGuest().getId().equals(currentUser.getId());
        boolean isHost = booking.getListing().getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isGuest && !isHost && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès interdit aux avis de cette réservation."));
        }

        // Récupérer tous les avis de la réservation
        List<Review> reviews = reviewRepository.findByBookingId(id);

        // Appliquer les règles de masque double-blind
        List<Map<String, Object>> formattedReviews = reviews.stream().map(review -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", review.getId());
            map.put("bookingId", review.getBooking().getId());
            map.put("authorId", review.getAuthor().getId());
            map.put("targetId", review.getTarget().getId());
            map.put("createdAt", review.getCreatedAt());

            Map<String, Object> authorMap = new HashMap<>();
            authorMap.put("id", review.getAuthor().getId());

            boolean isAuthor = review.getAuthor().getId().equals(currentUser.getId());

            if (review.getRevealedAt() != null || isAuthor || isAdmin) {
                map.put("rating", review.getRating());
                map.put("comment", review.getComment());
                map.put("revealedAt", review.getRevealedAt());
                authorMap.put("name", review.getAuthor().getName());
            } else {
                map.put("rating", null);
                map.put("comment", "Avis en attente de l'autre participant 🔒");
                map.put("revealedAt", null);
                authorMap.put("name", "Participant");
            }
            map.put("author", authorMap);

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(formattedReviews);
    }

    // 3. Récupérer les avis publics révélés d'un utilisateur (avec moyenne et badge)
    @GetMapping("/api/users/{id}/reviews")
    public ResponseEntity<?> getUserReviews(@PathVariable String id) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Utilisateur non trouvé."));
        }

        User user = optionalUser.get();

        // Récupérer les avis révélés ciblant cet utilisateur
        List<Review> reviews = reviewRepository.findByTargetIdAndRevealedAtIsNotNullOrderByCreatedAtDesc(id);

        // Calculer la moyenne
        double averageRating = 0;
        if (!reviews.isEmpty()) {
            double sum = 0;
            for (Review r : reviews) {
                sum += r.getRating();
            }
            averageRating = sum / reviews.size();
        }

        List<Map<String, Object>> reviewsList = reviews.stream().map(review -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", review.getId());
            map.put("bookingId", review.getBooking().getId());
            map.put("authorId", review.getAuthor().getId());
            map.put("targetId", review.getTarget().getId());
            map.put("rating", review.getRating());
            map.put("comment", review.getComment());
            map.put("revealedAt", review.getRevealedAt());
            map.put("createdAt", review.getCreatedAt());

            Map<String, Object> authorMap = new HashMap<>();
            authorMap.put("id", review.getAuthor().getId());
            authorMap.put("name", review.getAuthor().getName());
            map.put("author", authorMap);

            return map;
        }).collect(Collectors.toList());

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName());
        userMap.put("badge", user.getBadge().name());
        userMap.put("kycStatus", user.getKycStatus().name());

        Map<String, Object> res = new HashMap<>();
        res.put("user", userMap);
        res.put("reviews", reviewsList);
        res.put("averageRating", averageRating);
        res.put("reviewCount", reviews.size());

        return ResponseEntity.ok(res);
    }

    /**
     * Recalculates and updates the rating average and the trust badge for a given user.
     */
    private void updateSelfReputationAndBadge(String userId) {
        List<Review> reviews = reviewRepository.findByTargetIdAndRevealedAtIsNotNull(userId);
        int reviewCount = reviews.size();
        double averageRating = 0;
        if (reviewCount > 0) {
            double sum = 0;
            for (Review r : reviews) {
                sum += r.getRating();
            }
            averageRating = sum / reviewCount;
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return;
        }
        User user = userOpt.get();

        // Count completed or checked-in bookings for this user (both guest and host stays)
        List<BookingStatus> activeStatuses = Arrays.asList(BookingStatus.CHECKED_IN, BookingStatus.COMPLETED);
        long bookingsCount = bookingRepository.countByUserAndStatuses(userId, activeStatuses);

        Badge badge = Badge.NONE;

        if (user.getKycStatus() == KycStatus.VERIFIED) {
            badge = Badge.VERIFIED;

            // Critères Superhost (Burundi) :
            // hostStaysCount >= 3 et averageRating >= 4.5 et hostCancelledCount === 0
            long hostStaysCount = bookingRepository.countByListingOwnerIdAndStatusIn(userId, activeStatuses);
            long hostCancelledCount = bookingRepository.countByListingOwnerIdAndStatus(userId, BookingStatus.CANCELLED);

            if (hostStaysCount >= 3 && averageRating >= 4.5 && hostCancelledCount == 0) {
                badge = Badge.SUPERHOST;
            } else if (bookingsCount >= 3 && averageRating >= 4.5) {
                badge = Badge.FIABLE;
            }
        }

        user.setBadge(badge);
        userRepository.save(user);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByPhone(email).orElse(null));
    }
}
