package com.inzuconnect.inzuconnect_api.web.dto;

import com.inzuconnect.inzuconnect_api.domain.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AgentRegisterHostDto {
    @NotBlank(message = "name est requis")
    @Size(min = 2, max = 80, message = "name 2..80 caractères")
    private String name;

    @NotBlank(message = "email est requis")
    @Email(message = "email invalide")
    @Size(max = 160, message = "email trop long")
    private String email;

    @NotBlank(message = "password est requis")
    @Pattern(regexp = "^(?=.*[a-zà-ÿ])(?=.*[A-ZÀ-Ÿ])(?=.*\\d)(?=.*[^A-Za-z0-9à-ÿÀ-Ÿ]).{10,128}$",
             message = "password: 10+ chars, 1 lowercase, 1 uppercase, 1 chiffre, 1 symbole")
    private String password;

    @NotBlank(message = "phone est requis")
    @Pattern(regexp = "^\\+?[0-9]{8,16}$", message = "phone invalide")
    private String phone;

    private Role role;
}
