package com.inzuconnect.inzuconnect_api.web.error;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException() {
        super("Access denied");
    }
}
