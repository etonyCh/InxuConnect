package com.inzuconnect.inzuconnect_api.web.dto;

import lombok.Data;

@Data
public class OtpVerifyDto {
    private String phone;
    private String code;
}
