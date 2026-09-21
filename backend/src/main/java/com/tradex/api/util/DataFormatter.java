package com.tradex.api.util;

public final class DataFormatter {

    private DataFormatter() {
    }

    public static String maskEmail(String email) {
        return AuthUtils.maskEmail(email);
    }

    public static String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) {
            return "****";
        }
        int length = accountNumber.length();
        return (length <= 4) ? "****" : "****" + accountNumber.substring(length - 4);
    }
}
