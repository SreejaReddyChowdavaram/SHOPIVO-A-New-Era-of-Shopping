package com.securecommerce.platform.user.dto;

import java.time.Instant;

/**
 * AdminSellerListItemResponse — Operational seller table row projection for Admin console.
 */
public record AdminSellerListItemResponse(
        Long id,
        String sellerName,
        String email,
        String status,
        boolean enabled,
        Instant createdAt,
        long totalProducts,
        long totalOrders
) {}
