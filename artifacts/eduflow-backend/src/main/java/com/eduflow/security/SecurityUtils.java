package com.eduflow.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {
    private SecurityUtils() {}

    public static JwtAuthFilter.AuthPrincipal currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof JwtAuthFilter.AuthPrincipal p)) {
            throw new AccessDeniedException("Authentication required");
        }
        return p;
    }

    public static Long currentUserId() {
        return currentPrincipal().userId();
    }

    public static String currentRole() {
        return currentPrincipal().role();
    }

    public static boolean hasRole(String role) {
        return role.equalsIgnoreCase(currentRole());
    }

    public static void requireRole(String role) {
        if (!hasRole(role)) {
            throw new AccessDeniedException("Forbidden");
        }
    }
}
