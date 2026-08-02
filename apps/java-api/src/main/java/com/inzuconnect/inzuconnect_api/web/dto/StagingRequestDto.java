package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class StagingRequestDto {

    private Boolean payWithSavings;

    @Pattern(regexp = "^\\+?[0-9]{8,16}$")
    private String phone;

    @Pattern(regexp = "^(ECOCASH|LUMICASH)$")
    private String provider;
}
