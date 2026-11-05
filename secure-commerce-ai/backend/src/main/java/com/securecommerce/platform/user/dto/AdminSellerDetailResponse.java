package com.securecommerce.platform.user.dto;

import java.time.Instant;

/**
 * AdminSellerDetailResponse — Comprehensive operational platform record of a seller account.
 */
public record AdminSellerDetailResponse(
        Long id,
        String sellerName,
        String email,
        String status,
        boolean enabled,
        Instant createdAt,

        // Catalog Summary
        long totalProducts,
        long pendingProducts,
        long approvedProducts,
        long rejectedProducts,

        // Order Summary
        long totalOrders,
        long completedOrders,
        long cancelledOrders
) {}
