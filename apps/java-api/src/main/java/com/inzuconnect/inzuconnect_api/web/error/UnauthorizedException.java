package com.inzuconnect.inzuconnect_api.web.error;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException() {
        super("Unauthorized");
    }
}
