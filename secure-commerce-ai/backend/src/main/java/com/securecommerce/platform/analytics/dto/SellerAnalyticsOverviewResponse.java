package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record SellerAnalyticsOverviewResponse(
        long totalProducts,
        long activeProducts,
        long totalOrdersReceived,
        long totalUnitsSold,
        long deliveredOrders,
        long pendingOrders,
        long cancelledOrders,
        long returnedOrders,
        BigDecimal grossSales,
        BigDecimal refundAmount,
        String dateRangeLabel
) {}

