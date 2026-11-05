package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record AdminTopProductPoint(
        Long productId,
        String productName,
        String sellerName,
        long unitsSold,
        BigDecimal grossSales
) {}

