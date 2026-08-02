package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class B2bPolicyDto {
    @NotNull(message = "maxPricePerNight est requis")
    @Min(value = 0, message = "maxPricePerNight >= 0")
    @Max(value = 999_999_999, message = "maxPricePerNight trop élevé")
    private Integer maxPricePerNight;
}
