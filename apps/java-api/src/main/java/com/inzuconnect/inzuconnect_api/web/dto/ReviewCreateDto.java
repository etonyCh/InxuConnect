package com.inzuconnect.inzuconnect_api.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = false)
public class ReviewCreateDto {
    @NotBlank(message = "bookingId est requis")
    private String bookingId;

    @NotNull(message = "rating est requis")
    @Min(value = 1, message = "rating minimum 1")
    @Max(value = 5, message = "rating maximum 5")
    private Integer rating;

    @NotBlank(message = "comment est requis")
    @Size(max = 2000, message = "comment ne doit pas dépasser 2000 caractères")
    private String comment;

    private List<String> photoUrls;
}
