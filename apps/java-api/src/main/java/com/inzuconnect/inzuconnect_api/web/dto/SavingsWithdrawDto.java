package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SavingsWithdrawDto {
    @NotNull(message = "amount est requis")
    @Min(value = 1, message = "amount > 0")
    @Max(value = 999_999_999, message = "amount trop élevé")
    private Integer amount;
}
