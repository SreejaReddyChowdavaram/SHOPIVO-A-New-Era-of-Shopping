package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

/**
 * DailySalesPoint — Time-series data point for seller sales trends.
 * Represents orders, units sold, and gross sales on a specific date (YYYY-MM-DD).
 */
public record DailySalesPoint(
        String date,
        long orders,
        long units,
        BigDecimal sales
) {}
