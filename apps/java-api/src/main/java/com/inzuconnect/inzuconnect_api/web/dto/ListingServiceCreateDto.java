package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ListingServiceCreateDto {

    @NotBlank
    private String name;

    @Size(max = 2000)
    private String description;

    @Min(0)
    private Integer price;
}
