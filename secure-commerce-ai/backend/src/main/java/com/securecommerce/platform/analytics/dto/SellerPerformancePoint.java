package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record SellerPerformancePoint(
        Long sellerId,
        String sellerName,
        BigDecimal grossSales,
        long ordersCount,
        long unitsSold
) {}

