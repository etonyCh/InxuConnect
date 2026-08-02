package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class BookingSosDto {
    @DecimalMin(value = "-90.0", message = "latitude invalide")
    @DecimalMax(value = "90.0", message = "latitude invalide")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "longitude invalide")
    @DecimalMax(value = "180.0", message = "longitude invalide")
    private Double longitude;
}
