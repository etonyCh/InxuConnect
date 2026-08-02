package com.inzuconnect.inzuconnect_api.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Set;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(allowGetters = true, ignoreUnknown = false)
public class VoiceFiltersDto {
    public static final Set<String> ALLOWED_CITIES = Set.of("Bujumbura", "Gitega", "Ngozi");

    @Pattern(regexp = "^(Bujumbura|Gitega|Ngozi)$", message = "city invalide")
    private String city;

    @Min(value = 0, message = "maxPrice >= 0")
    @Max(value = 999_999_999, message = "maxPrice trop élevé")
    private Integer maxPrice;

    private Boolean hasGenerator;
    private Boolean hasWaterTank;
    private Boolean hasStarlink;
    private Boolean hasSecurityGuard;
    private Boolean hasKitchen;

    @NotNull(message = "interpretedQuery est requis")
    @Size(max = 240, message = "interpretedQuery max 240")
    private String interpretedQuery;
}
