package com.tradex.api.enums;

public enum Permission {
    MANAGE_USERS("User Management", "View and edit employee accounts and user access rights", "Administration"),
    MANAGE_POINTS("Points Management", "Adjust user loyalty points and rewards", "Operations"),
    MANAGE_DEPOSITS("Approve/Reject Deposits", "Review, approve or reject manual fiat/crypto deposit requests", "Financial Ops"),
    MANAGE_WITHDRAWALS("Approve/Reject Withdrawals", "Review and authorize user withdrawals", "Financial Ops"),
    MANAGE_SETTINGS("System Settings", "Configure application fee rates, thresholds and features", "Administration");

    private final String displayName;
    private final String description;
    private final String category;

    Permission(String displayName, String description, String category) {
        this.displayName = displayName;
        this.description = description;
        this.category = category;
    }

    public String getDisplayName() { return displayName; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }

    public String getAuthority() {
        return "PERM_" + name();
    }
}


