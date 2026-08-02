package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class KycWebhookDto {
    @NotBlank
    private String userId;

    @NotBlank
    @Pattern(regexp = "^(APPROVED|REJECTED)$")
    private String result;
}
