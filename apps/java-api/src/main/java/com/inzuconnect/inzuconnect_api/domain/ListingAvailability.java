package com.inzuconnect.inzuconnect_api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"ListingAvailability\"", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"\"listingId\"", "date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"listingId\"", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Listing listing;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(name = "\"isAvailable\"", nullable = false)
    private boolean isAvailable = true;

    @CreationTimestamp
    @Column(name = "\"createdAt\"", updatable = false)
    private LocalDateTime createdAt;
}
