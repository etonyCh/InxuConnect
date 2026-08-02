package com.inzuconnect.inzuconnect_api.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = false)
public class AdminKycRejectDto {
    @NotBlank(message = "reason est requis")
    @Size(max = 1000, message = "reason ne doit pas dépasser 1000 caractères")
    private String reason;
}
