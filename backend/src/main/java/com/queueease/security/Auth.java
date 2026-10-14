package com.queueease.security;

import org.springframework.security.core.context.SecurityContextHolder;

public final class Auth {
    private Auth() {}
    public static Long uid() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
    public static boolean staff() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_STAFF"));
    }
}
