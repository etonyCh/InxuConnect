package com.inzuconnect.inzuconnect_api.web.dto;

import com.inzuconnect.inzuconnect_api.domain.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterDto {
    @NotBlank(message = "Le nom est requis")
    @Size(min = 2, max = 80, message = "Le nom doit faire 2..80 caractères")
    private String name;

    @NotBlank(message = "L'email est requis")
    @Email(message = "L'email doit être valide")
    @Size(max = 160, message = "L'email est trop long")
    private String email;

    @NotBlank(message = "Le mot de passe est requis")
    @Size(min = 10, max = 128, message = "Le mot de passe doit faire 10..128 caractères")
    @Pattern(regexp = "^(?=.*[a-zà-ÿ])(?=.*[A-ZÀ-Ÿ])(?=.*\\d)(?=.*[^A-Za-z0-9à-ÿÀ-Ÿ]).{10,128}$",
             message = "Le mot de passe nécessite au moins 1 minuscule, 1 majuscule, 1 chiffre et 1 symbole")
    private String password;

    @Size(max = 24)
    @Pattern(regexp = "^$|^\\+?[0-9]{8,16}$", message = "numéro de téléphone invalide")
    private String phone;

    private String otpCode;

    private String confirmPassword;

    private Role role;
}
