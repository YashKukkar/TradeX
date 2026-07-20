package com.tradex.api.enums;

public enum Permission {
    MANAGE_USERS,
    MANAGE_POINTS,
    MANAGE_DEPOSITS,
    MANAGE_WITHDRAWALS,
    MANAGE_SETTINGS;

    public String getAuthority() {
        return "PERM_" + name();
    }
}

