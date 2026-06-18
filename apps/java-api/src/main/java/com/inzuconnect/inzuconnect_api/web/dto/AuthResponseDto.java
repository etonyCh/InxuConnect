package com.inzuconnect.inzuconnect_api.web.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponseDto {
    private String token;
    private UserDto user;

    @Data
    @Builder
    public static class UserDto {
        private String id;
        private String email;
        private String name;
        private String phone;
        private String role;
        private String badge;
        private boolean phoneVerified;
        private String kycStatus;
    }
}
