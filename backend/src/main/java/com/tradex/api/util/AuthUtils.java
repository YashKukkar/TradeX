package com.tradex.api.util;

import java.util.Locale;

public final class AuthUtils {

    private AuthUtils() {
    }

    public static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "[EMPTY_EMAIL]";
        }
        String normalized = normalizeEmail(email);
        int atIndex = normalized.indexOf('@');
        if (atIndex <= 0) {
            return "***";
        }
        String userPart = normalized.substring(0, atIndex);
        String domainPart = normalized.substring(atIndex);
        if (userPart.length() <= 2) {
            return userPart.charAt(0) + "***" + domainPart;
        }
        return userPart.substring(0, 2) + "***" + domainPart;
    }
}
