package com.tradex.api.enums;

public enum Role {
    USER,
    ADMIN;

    public String getAuthority() {
        return "ROLE_" + name();
    }
}
