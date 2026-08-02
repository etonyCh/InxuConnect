package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class PriceCoachDto {

    @NotBlank
    private String city;

    @Min(0)
    @Max(20)
    private Integer bedrooms = 1;

    @Min(0)
    @Max(20)
    private Integer bathrooms = 1;

    private List<String> amenities;

    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$")
    private String date;
}
