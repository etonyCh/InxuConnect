package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginDto {
    @Email(message = "L'email doit être valide")
    private String email;

    private String phone;

    @NotBlank(message = "Le mot de passe est requis")
    private String password;

    @AssertTrue(message = "Vous devez fournir soit un email, soit un numéro de téléphone")
    public boolean isIdentifierProvided() {
        boolean hasEmail = email != null && !email.trim().isEmpty();
        boolean hasPhone = phone != null && !phone.trim().isEmpty();
        return hasEmail || hasPhone;
    }
}
