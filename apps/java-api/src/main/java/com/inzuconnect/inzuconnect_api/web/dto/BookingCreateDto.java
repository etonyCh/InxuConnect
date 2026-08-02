package com.inzuconnect.inzuconnect_api.web.dto;

import com.inzuconnect.inzuconnect_api.domain.enums.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class BookingCreateDto {
    @NotBlank(message = "listingId est requis")
    private String listingId;

    @NotBlank(message = "checkIn est requis (format ISO_LOCAL_DATE_TIME)")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}(:\\d{2})?)?$",
             message = "checkIn invalide, attendu AAAA-MM-JJ[THH:MM[:SS]]")
    private String checkIn;

    @NotBlank(message = "checkOut est requis (format ISO_LOCAL_DATE_TIME)")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}(:\\d{2})?)?$",
             message = "checkOut invalide, attendu AAAA-MM-JJ[THH:MM[:SS]]")
    private String checkOut;

    @NotNull(message = "totalPrice est requis")
    @Min(value = 0, message = "totalPrice >= 0")
    @Max(value = 999_999_999, message = "totalPrice trop élevé")
    private Integer totalPrice;

    @NotNull(message = "paymentMethod est requis")
    private PaymentMethod paymentMethod;

    @NotBlank(message = "phone est requis")
    @Pattern(regexp = "^\\+?[0-9]{8,16}$", message = "numéro de téléphone invalide")
    private String phone;

    private List<@NotBlank(message = "chaque serviceItemId est une chaîne non vide") String> serviceItemIds;
}
