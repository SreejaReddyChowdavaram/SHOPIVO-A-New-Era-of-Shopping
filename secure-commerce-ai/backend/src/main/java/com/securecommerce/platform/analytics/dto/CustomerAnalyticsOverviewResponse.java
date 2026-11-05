package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record CustomerAnalyticsOverviewResponse(
        long totalOrders,
        long deliveredOrders,
        long pendingOrders,
        long cancelledOrders,
        long returnedOrders,
        BigDecimal totalAmountSpent,
        BigDecimal totalRefundAmount,
        long wishlistCount,
        String dateRangeLabel
) {}

