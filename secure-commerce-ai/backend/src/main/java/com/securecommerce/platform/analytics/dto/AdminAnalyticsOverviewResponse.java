package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record AdminAnalyticsOverviewResponse(
        long totalCustomers,
        long totalSellers,
        long totalProducts,
        long totalOrders,
        long deliveredOrders,
        long pendingOrders,
        long cancelledOrders,
        long returnedOrders,
        BigDecimal totalOrderValue,
        BigDecimal refundAmount,
        String dateRangeLabel
) {}

