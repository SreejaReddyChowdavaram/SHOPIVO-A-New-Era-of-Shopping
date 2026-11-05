package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

/**
 * SellerAnalyticsSummaryResponse — High-level sales and order metrics for an authenticated seller.
 * All metrics are calculated exclusively from order items belonging to the seller.
 */
public record SellerAnalyticsSummaryResponse(
        long totalOrders,
        long completedOrders,
        long cancelledOrders,
        long unitsSold,
        BigDecimal grossSales,
        BigDecimal refundedAmount
) {}
