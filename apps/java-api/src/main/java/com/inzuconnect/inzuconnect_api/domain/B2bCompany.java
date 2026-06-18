package com.inzuconnect.inzuconnect_api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "\"B2bCompany\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class B2bCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String tier;

    @Column(name = "\"saasFee\"", nullable = false)
    private Integer saasFee;

    @Column(name = "\"maxPricePerNight\"", nullable = false)
    private Integer maxPricePerNight = 100000;

    @CreationTimestamp
    @Column(name = "\"createdAt\"", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "b2bCompany")
    private Set<User> users = new HashSet<>();

    @OneToMany(mappedBy = "b2bCompany")
    private Set<Booking> bookings = new HashSet<>();
}
