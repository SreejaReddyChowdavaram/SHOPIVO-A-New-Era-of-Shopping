package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

/**
 * TopSellingProductResponse — Performance metric of a top-selling product for a seller.
 */
public record TopSellingProductResponse(
        Long productId,
        String productName,
        long unitsSold,
        BigDecimal grossSales,
        int currentStock
) {}
