package com.inzuconnect.inzuconnect_api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
            joinColumns = @JoinColumn(name = "\"B\""),
            inverseJoinColumns = @JoinColumn(name = "\"A\"")
    )
    private Set<Amenity> amenities = new HashSet<>();

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ListingAvailability> availabilities = new ArrayList<>();

    @Version
    @Column(name = "\"version\"", nullable = false)
    private Long version = 0L;

    /* =========================================================================================
     * HOST SETTINGS — Listing & Calendar, Pricing & Fees, Booking Rules, Co-Host Access
     * ========================================================================================= */

    @Column(name = "\"propertyType\"")
    private String propertyType;

    @Column(name = "\"floor\"")
    private Integer floor;

    @Column(name = "\"squareMeters\"")
    private Integer squareMeters;

    @Column(name = "\"listingPublished\"", nullable = false)
    private boolean listingPublished = false;

    /* ----- Pricing & Fees ----- */

    @Column(name = "\"cleaningFee\"", nullable = false)
    private Integer cleaningFee = 0;

    @Column(name = "\"serviceFeePercent\"", nullable = false)
    private Integer serviceFeePercent = 8;

    @Column(name = "\"weeklyDiscountPercent\"", nullable = false)
    private Integer weeklyDiscountPercent = 0;

    @Column(name = "\"monthlyDiscountPercent\"", nullable = false)
    private Integer monthlyDiscountPercent = 0;

    @Column(name = "\"extraGuestFee\"", nullable = false)
    private Integer extraGuestFee = 0;

    @Column(name = "\"petFee\"", nullable = false)
    private Integer petFee = 0;

    @Column(name = "\"minPrice\"")
    private Integer minPrice;

    @Column(name = "\"maxPrice\"")
    private Integer maxPrice;

    /* ----- Booking Rules ----- */

    @Column(name = "\"instantBookEnabled\"", nullable = false)
    private boolean instantBookEnabled = false;

    @Column(name = "\"minStayNights\"", nullable = false)
    private Integer minStayNights = 1;

    @Column(name = "\"maxStayNights\"", nullable = false)
    private Integer maxStayNights = 90;

    @Column(name = "\"advanceNoticeHours\"", nullable = false)
    private Integer advanceNoticeHours = 24;

    @Column(name = "\"bookingWindowDays\"")
    private Integer bookingWindowDays = 365;

    @Column(name = "\"checkInTime\"", length = 16)
    private String checkInTime = "14:00";

    @Column(name = "\"checkOutTime\"", length = 16)
    private String checkOutTime = "11:00";

    @Column(name = "\"allowPets\"", nullable = false)
    private boolean allowPets = false;

    @Column(name = "\"allowSmoking\"", nullable = false)
    private boolean allowSmoking = false;

    @Column(name = "\"allowParties\"", nullable = false)
    private boolean allowParties = false;

    @Column(name = "\"requireGuestId\"", nullable = false)
    private boolean requireGuestId = true;

    @Column(name = "\"customRules\"", columnDefinition = "TEXT")
    private String customRules;

    /* ----- Co-Host Access ----- */

    @Column(name = "\"coHostIds\"")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Set<String> coHostIds = new HashSet<>();

    @Column(name = "\"coHostPermissions\"")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, Object> coHostPermissions = new java.util.HashMap<>();
}
