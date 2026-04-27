package com.leadrat.crm.common;

public class LeadratApiException extends RuntimeException {
    private final int statusCode;

    public LeadratApiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public LeadratApiException(String message, int statusCode, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
