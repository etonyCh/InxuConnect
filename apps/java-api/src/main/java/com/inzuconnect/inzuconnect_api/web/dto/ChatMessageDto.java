package com.inzuconnect.inzuconnect_api.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = false)
public class ChatMessageDto {
    @NotBlank(message = "senderId est requis")
    private String senderId;

    @NotBlank(message = "receiverId est requis")
    private String receiverId;

    @NotBlank(message = "content est requis")
    @Size(max = 4000, message = "content ne doit pas dépasser 4000 caractères")
    private String content;

    private String chatRoomId;

    private Long timestamp;
}
