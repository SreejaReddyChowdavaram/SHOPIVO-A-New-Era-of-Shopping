package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record MonthlyPurchasePoint(
        String month,
        long orderCount,
        BigDecimal amountSpent
) {}

