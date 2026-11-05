package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminRecentActivityResponse(
        List<RecentOrderRecord> recentOrders,
        List<RecentUserRecord> newCustomers,
        List<RecentUserRecord> newSellers,
        List<RecentReturnRecord> recentReturns
) {
    public record RecentOrderRecord(
            Long id,
            String customerName,
            BigDecimal totalAmount,
            String status,
            Instant createdAt
    ) {}

    public record RecentUserRecord(
            Long id,
            String name,
            String email,
            String role,
            boolean enabled,
            Instant createdAt
    ) {}

    public record RecentReturnRecord(
            Long id,
            Long orderId,
            String customerName,
            String productName,
            String reason,
            String returnStatus,
            String refundStatus,
            BigDecimal refundAmount,
            Instant requestedAt
    ) {}
}

