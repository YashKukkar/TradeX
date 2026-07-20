package com.tradex.api.enums;

public enum Role {
    USER,
    EMPLOYEE,
    SUPER_ADMIN;

    public String getAuthority() {
        return "ROLE_" + name();
    }
}
