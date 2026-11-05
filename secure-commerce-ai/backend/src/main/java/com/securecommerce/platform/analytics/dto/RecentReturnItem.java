package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record RecentReturnItem(
        Long returnId,
        Long orderId,
        String productName,
        String imageUrl,
        String reason,
        String returnStatus,
        String refundStatus,
        BigDecimal refundAmount,
        Instant requestedAt
) {}

