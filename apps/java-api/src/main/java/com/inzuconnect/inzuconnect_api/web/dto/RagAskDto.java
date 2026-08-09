package com.inzuconnect.inzuconnect_api.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RagAskDto {

    @NotBlank
    @Size(min = 2, max = 800)
    private String question;

    @Min(1)
    @Max(20)
    private Integer topK = 5;
}
