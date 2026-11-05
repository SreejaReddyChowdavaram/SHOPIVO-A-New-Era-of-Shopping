package com.securecommerce.platform.user.dto;

import com.securecommerce.platform.user.entity.User;

import java.time.Instant;

/**
 * AdminUserListItemResponse — Lightweight projection for paged user administration.
 */
public record AdminUserListItemResponse(
        Long id,
        String firstName,
        String lastName,
        String fullName,
        String email,
        String role,
        String status,
        boolean enabled,
        Instant createdAt
) {
    public static AdminUserListItemResponse from(User user) {
        return new AdminUserListItemResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.isEnabled() ? "ACTIVE" : "SUSPENDED",
                user.isEnabled(),
                user.getCreatedAt()
        );
    }
}
