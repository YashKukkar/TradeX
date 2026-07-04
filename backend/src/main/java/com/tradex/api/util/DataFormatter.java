package com.tradex.api.util;

public final class DataFormatter {

    private DataFormatter() {
    }

    public static String maskEmail(String email) {

        if (email == null || email.isBlank()) {
            return email;
        }

        int atIndex = email.indexOf('@');

        if (atIndex <= 0 || atIndex == email.length() - 1) {
            return email;
        }

        String name = email.substring(0, atIndex);
        String domain = email.substring(atIndex + 1);

        String maskedName = switch (name.length()) {
            case 1, 2 -> name.charAt(0) + "***";
            case 3 -> name.substring(0, 2) + "***";
            default -> name.substring(0, 2) + "***" + name.charAt(name.length() - 1);
        };

        return maskedName + "@" + domain;
    }

    public static String maskPhoneNumber(String phone) {

        if (phone == null || phone.length() <= 4) {
            return phone;
        }

        return "*".repeat(phone.length() - 4)
                + phone.substring(phone.length() - 4);
    }

    public static String maskAccountNumber(String account) {

        if (account == null || account.length() <= 4) {
            return account;
        }

        return "*".repeat(account.length() - 4)
                + account.substring(account.length() - 4);
    }
}
