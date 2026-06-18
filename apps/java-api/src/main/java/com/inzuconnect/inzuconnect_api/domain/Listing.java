package com.inzuconnect.inzuconnect_api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "\"Listing\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private Integer price;

    @Column(nullable = false)
    private String city;

    private String address;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false)
    private Integer bedrooms = 1;

    @Column(nullable = false)
    private Integer bathrooms = 1;

    @Column(name = "\"taxiMotoDistance\"")
    private Integer taxiMotoDistance;

    @Column(name = "\"surchargeGenerator\"", nullable = false)
    private Integer surchargeGenerator = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"ownerId\"", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "b2bCompany"})
    private User owner;

    @Column(nullable = false)
    private String country = "Burundi";

    @Column(nullable = false)
    private String currency = "BIF";

    @CreationTimestamp
    @Column(name = "\"createdAt\"", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Photo> photos = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "\"_AmenityToListing\"",
            joinColumns = @JoinColumn(name = "\"B\""), // Mapping Prisma implicite
            inverseJoinColumns = @JoinColumn(name = "\"A\"")
    )
    private Set<Amenity> amenities = new HashSet<>();

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ListingAvailability> availabilities = new ArrayList<>();

    // TODO: Bookings, Services, StagingRequests
}
