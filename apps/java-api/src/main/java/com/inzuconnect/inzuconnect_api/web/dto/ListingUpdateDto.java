package com.inzuconnect.inzuconnect_api.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = false)
public class ListingUpdateDto {

    @Size(max = 200)
    private String title;

    @Min(0)
    private Integer price;

    private String city;
    private String country;
    private String currency;
    private String address;

    @Min(0)
    private Integer bedrooms;

    @Min(0)
    private Integer bathrooms;

    @Min(0)
    private Integer taxiMotoDistance;

    @Min(0)
    private Integer surchargeGenerator;

    @DecimalMin("-90")
    @DecimalMax("90")
    private Double latitude;

    @DecimalMin("-180")
    @DecimalMax("180")
    private Double longitude;

    @Size(max = 5000)
    private String description;

    private List<String> photos;
    private List<String> amenities;
}
