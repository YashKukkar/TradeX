package com.tradex.api.util;

import com.tradex.api.exception.AppException.UnauthorizedException;
import java.security.Principal;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static String getAuthenticatedEmail(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new UnauthorizedException("Authentication principal is missing");
        }
        return principal.getName();
    }
}
