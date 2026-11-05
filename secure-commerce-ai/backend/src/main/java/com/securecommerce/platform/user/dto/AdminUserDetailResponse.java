package com.securecommerce.platform.user.dto;

import com.securecommerce.platform.user.entity.User;

import java.time.Instant;

/**
 * AdminUserDetailResponse — Safe, detailed view of a user for platform administrators.
 * Sensitive data such as password hashes, payment PANs, and reset tokens are strictly excluded.
 */
public record AdminUserDetailResponse(
        Long id,
        String firstName,
        String lastName,
        String fullName,
        String email,
        String role,
        String status,
        boolean enabled,
        Instant createdAt,
        Instant updatedAt,
        AdminSellerInfo sellerInfo,
        AdminCustomerInfo customerInfo
) {
    public record AdminSellerInfo(
            long totalProducts,
            long approvedProducts,
            long pendingProducts,
            long totalOrders
    ) {}

    public record AdminCustomerInfo(
            long totalOrders
    ) {}

    public static AdminUserDetailResponse from(
            User user,
            AdminSellerInfo sellerInfo,
            AdminCustomerInfo customerInfo
    ) {
        return new AdminUserDetailResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.isEnabled() ? "ACTIVE" : "SUSPENDED",
                user.isEnabled(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                sellerInfo,
                customerInfo
        );
    }
}
