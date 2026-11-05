package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record MonthlyGmvPoint(
        String month,
        BigDecimal gmv,
        BigDecimal netRevenue
) {}
