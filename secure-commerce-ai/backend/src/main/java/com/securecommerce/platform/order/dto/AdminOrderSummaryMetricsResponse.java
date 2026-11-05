package com.securecommerce.platform.order.dto;

import java.math.BigDecimal;

/**
 * AdminOrderSummaryMetricsResponse — Platform-wide operational order metrics for Admin dashboard.
 */
public record AdminOrderSummaryMetricsResponse(
        long totalOrders,
        long pendingOrders,
        long processingOrders,
        long shippedOrders,
        long deliveredOrders,
        long cancelledOrders,
        BigDecimal totalOrderValue
) {}
