package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PaymentWebhookDto {
    @NotBlank
    private String reference;

    @NotBlank
    @Pattern(regexp = "^(SUCCESS|FAILED|PENDING)$")
    private String status;
}
