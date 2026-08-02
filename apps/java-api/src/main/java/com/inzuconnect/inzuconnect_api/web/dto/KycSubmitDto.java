package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class KycSubmitDto {
    @NotBlank
    @Pattern(regexp = "^https?://.*$", message = "cniUrl doit être une URL valide (http/https)")
    private String cniUrl;

    @NotBlank
    @Pattern(regexp = "^https?://.*$", message = "selfieUrl doit être une URL valide (http/https)")
    private String selfieUrl;
}
