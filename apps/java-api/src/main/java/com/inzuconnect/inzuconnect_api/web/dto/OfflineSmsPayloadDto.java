package com.inzuconnect.inzuconnect_api.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = false)
public class OfflineSmsPayloadDto {
    @NotBlank(message = "from est requis")
    @Pattern(regexp = "^\\+?[0-9]{8,16}$", message = "numéro de téléphone invalide")
    private String from;

    @NotBlank(message = "text est requis")
    @Size(max = 500, message = "text ne doit pas dépasser 500 caractères")
    private String text;

    private String messageId;
}
