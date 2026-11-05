package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record MonthlySalesPoint(
        String month,
        BigDecimal grossSales,
        long ordersReceived,
        long unitsSold
) {}

