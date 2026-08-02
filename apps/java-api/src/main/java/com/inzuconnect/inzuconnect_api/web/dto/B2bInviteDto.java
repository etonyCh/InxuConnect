package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class B2bInviteDto {
    @Email(message = "email invalide")
    @Size(max = 160)
    private String email;

    @Pattern(regexp = "^\\+?[0-9]{8,16}$", message = "phone invalide")
    private String phone;
}
