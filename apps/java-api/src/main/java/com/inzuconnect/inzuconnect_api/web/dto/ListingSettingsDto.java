package com.inzuconnect.inzuconnect_api.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class ListingSettingsDto {

    /* -------- Listing & Calendar -------- */
    @Size(max = 255)
    private String title;

    private String description;

    @Size(max = 128)
    private String propertyType;

    @Size(max = 255)
    private String address;

    @Size(max = 128)
    private String city;

    @Size(max = 128)
    private String country;

    private Integer floor;
    private Integer squareMeters;
    private Double latitude;
    private Double longitude;

    private Boolean listingPublished;

    /* -------- Pricing & Fees -------- */
    @Min(0)
    private Integer price;

    @Size(max = 8)
    private String currency;

    @Min(0)
    private Integer cleaningFee;

    @Min(0) @Max(100)
    private Integer serviceFeePercent;

    @Min(0) @Max(100)
    private Integer weeklyDiscountPercent;

    @Min(0) @Max(100)
    private Integer monthlyDiscountPercent;

    @Min(0)
    private Integer extraGuestFee;

    @Min(0)
    private Integer petFee;

    private Integer minPrice;
    private Integer maxPrice;

    /* -------- Booking Rules -------- */
    private Boolean instantBookEnabled;

    @Min(0)
    private Integer minStayNights;

    @Min(1)
    private Integer maxStayNights;

    @Min(0)
    private Integer advanceNoticeHours;

    private Integer bookingWindowDays;

    @Size(max = 16)
    private String checkInTime;

    @Size(max = 16)
    private String checkOutTime;

    private Boolean allowPets;
    private Boolean allowSmoking;
    private Boolean allowParties;
    private Boolean requireGuestId;

    private String customRules;

    /* -------- Co-Host Access (per-listing override) -------- */
    private Set<String> coHostIds;
    private Map<String, Object> coHostPermissions;
}
