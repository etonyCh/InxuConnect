package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SavingsToggleDto {
    @NotNull(message = "enabled est requis (true/false)")
    private Boolean enabled;
}
