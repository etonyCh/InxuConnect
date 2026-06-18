package com.inzuconnect.inzuconnect_api.domain;

import com.inzuconnect.inzuconnect_api.domain.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"Booking\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"listingId\"", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"guestId\"", nullable = false)
    private User guest;

    @Column(name = "\"checkIn\"", nullable = false)
    private LocalDateTime checkIn;

    @Column(name = "\"checkOut\"", nullable = false)
    private LocalDateTime checkOut;

    @Column(name = "\"totalPrice\"", nullable = false)
    private Integer totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @CreationTimestamp
    @Column(name = "\"createdAt\"", updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"b2bCompanyId\"")
    private B2bCompany b2bCompany;
}
