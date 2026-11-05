package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record RecentPurchaseItem(
        Long orderId,
        Long productId,
        String productName,
        String imageUrl,
        int quantity,
        BigDecimal price,
        BigDecimal lineTotal,
        String orderStatus,
        Instant orderDate
) {}

