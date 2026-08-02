package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class AgentListingCreateDto {
    @NotBlank(message = "title est requis")
    @Size(min = 3, max = 160, message = "title 3..160")
    private String title;

    @Size(max = 5000, message = "description max 5000")
    private String description;

    @NotNull(message = "price est requis")
    @Min(value = 0, message = "price >= 0")
    @Max(value = 999_999_999, message = "price trop élevé")
    private Integer price;

    @NotBlank(message = "city est requis")
    @Size(min = 2, max = 60, message = "city 2..60")
    private String city;

    @Size(max = 200, message = "address max 200")
    private String address;

    @NotBlank(message = "ownerId est requis")
    private String ownerId;

    @Min(value = 0, message = "bedrooms >= 0")
    @Max(value = 64, message = "bedrooms <= 64")
    private Integer bedrooms;

    @Min(value = 0, message = "bathrooms >= 0")
    @Max(value = 64, message = "bathrooms <= 64")
    private Integer bathrooms;

    @Min(value = 0, message = "taxiMotoDistance >= 0")
    @Max(value = 500_000, message = "taxiMotoDistance <= 500000")
    private Integer taxiMotoDistance;

    @Min(value = 0, message = "surchargeGenerator >= 0")
    @Max(value = 999_999_999, message = "surchargeGenerator trop élevé")
    private Integer surchargeGenerator;

    private List<@NotBlank(message = "url photo invalide") String> photos;
    private List<@NotBlank(message = "nom amenity invalide") String> amenities;
}
