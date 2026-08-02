package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AdminKycReviewDto {
    @NotBlank(message = "status est requis")
    @Pattern(regexp = "^(VERIFIED|REJECTED)$", message = "status: VERIFIED | REJECTED")
    private String status;
}
