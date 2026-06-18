package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ListingCreateDto {

    @NotBlank(message = "Le titre est requis")
    @Size(min = 3, message = "Le titre doit faire au moins 3 caractères")
    private String title;

    private String description;

    @NotNull(message = "Le prix est requis")
    @Min(value = 0, message = "Le prix ne peut pas être négatif")
    private Integer price;

    @NotBlank(message = "La ville est requise")
    @Size(min = 2, message = "La ville doit faire au moins 2 caractères")
    private String city;

    private String country;
    private String currency;
    private String address;

    @Min(value = 0, message = "Le nombre de chambres doit être positif")
    private Integer bedrooms;

    @Min(value = 0, message = "Le nombre de salles de bain doit être positif")
    private Integer bathrooms;

    @Min(value = 0, message = "La distance taxi moto doit être positive")
    private Integer taxiMotoDistance;

    @Min(value = 0, message = "Le supplément générateur doit être positif")
    private Integer surchargeGenerator;

    private List<String> photos;
    private List<String> amenities;

    private Double latitude;
    private Double longitude;
}
