package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PresignedUrlRequestDto {

    @NotBlank
    @Pattern(regexp = "^[a-zA-Z0-9\\.\\-_ ]+$")
    private String fileName;

    @NotBlank
    private String contentType;
}
