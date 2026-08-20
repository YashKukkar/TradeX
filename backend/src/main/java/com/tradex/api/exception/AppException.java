package com.tradex.api.exception;

import org.springframework.http.HttpStatus;

public class AppException extends RuntimeException {
    private final HttpStatus status;

    public AppException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static class BadRequestException extends AppException {
        public BadRequestException(String message) {
            super(HttpStatus.BAD_REQUEST, message);
        }
    }

    public static class ConflictException extends AppException {
        public ConflictException(String message) {
            super(HttpStatus.CONFLICT, message);
        }
    }

    public static class ForbiddenException extends AppException {
        public ForbiddenException(String message) {
            super(HttpStatus.FORBIDDEN, message);
        }
    }

    public static class ResourceNotFoundException extends AppException {
        public ResourceNotFoundException(String message) {
            super(HttpStatus.NOT_FOUND, message);
        }
    }

    public static class UnauthorizedException extends AppException {
        public UnauthorizedException(String message) {
            super(HttpStatus.UNAUTHORIZED, message);
        }
    }

    public static class TooManyRequestsException extends AppException {
        public TooManyRequestsException(String message) {
            super(HttpStatus.TOO_MANY_REQUESTS, message);
        }
    }
}

