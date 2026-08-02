package com.inzuconnect.inzuconnect_api.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = false)
public class MessageSendDto {
    @NotBlank(message = "chatRoomId est requis")
    private String chatRoomId;

    @NotBlank(message = "content est requis")
    @Size(max = 4000, message = "content ne doit pas dépasser 4000 caractères")
    private String content;
}
