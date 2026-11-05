package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record AdminPurchaseVsReturnPoint(
        String month,
        long ordersPlaced,
        long ordersReturned,
        double returnRate,
        BigDecimal orderValue,
        BigDecimal refundValue
) {}
