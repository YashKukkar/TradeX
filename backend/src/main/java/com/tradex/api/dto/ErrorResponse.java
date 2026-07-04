package com.tradex.api.dto;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

public record ErrorResponse(
    Instant timestamp,
    int status,
    String error,
    String message,
    String path,
    Map<String, String> validationErrors
) {
    public ErrorResponse(int status, String error, String message) {
        this(Instant.now(), status, error, message, null, null);
    }

    public ErrorResponse(int status, String error, String message, String path) {
        this(Instant.now(), status, error, message, path, null);
    }

    public ErrorResponse(int status, String error, String message, String path, Map<String, String> validationErrors) {
        this(Instant.now(), status, error, message, path, validationErrors);
    }

    public ErrorResponse(int status, String error, Map<String, String> validationErrors, String path) {
        this(
            Instant.now(),
            status,
            error,
            validationErrors == null || validationErrors.isEmpty() ? "Validation failed" :
                validationErrors.entrySet().stream()
                    .map(entry -> entry.getKey() + ": " + entry.getValue())
                    .collect(Collectors.joining(", ")),
            path,
            validationErrors
        );
    }

    public ErrorResponse(int status, String error, Map<String, String> validationErrors) {
        this(status, error, validationErrors, null);
    }
}
