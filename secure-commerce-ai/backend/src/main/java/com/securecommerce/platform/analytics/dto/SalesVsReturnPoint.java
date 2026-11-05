package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record SalesVsReturnPoint(
        String month,
        long unitsSold,
        long unitsReturned,
        double returnRate,
        BigDecimal grossSales,
        BigDecimal refundAmount
) {}
