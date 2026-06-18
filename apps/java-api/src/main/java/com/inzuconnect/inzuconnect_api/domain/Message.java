package com.inzuconnect.inzuconnect_api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"Message\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"bookingId\"", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"senderId\"", nullable = false)
    private User sender;

    @Column(name = "\"bodyOriginal\"", columnDefinition = "TEXT", nullable = false)
    private String bodyOriginal;

    @Column(name = "\"bodyTranslated\"", columnDefinition = "TEXT", nullable = false)
    private String bodyTranslated;

    @Column(nullable = false)
    private String lang;

    @CreationTimestamp
    @Column(name = "\"createdAt\"", updatable = false)
    private LocalDateTime createdAt;
}
