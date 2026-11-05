package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record SellerRecentOrderResponse(
        Long orderId,
        String customerName,
        String productName,
        String productImageUrl,
        int quantity,
        BigDecimal amount,
        String status,
        Instant orderDate
) {}
