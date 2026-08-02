package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class B2bRegisterDto {
    @NotBlank(message = "name est requis")
    @Size(min = 2, max = 140, message = "name 2..140")
    private String name;

    @NotBlank(message = "tier est requis (PME ou ONG_INTERNATIONALE)")
    @Pattern(regexp = "^(PME|ONG_INTERNATIONALE)$", message = "tier: PME | ONG_INTERNATIONALE")
    private String tier;
}
