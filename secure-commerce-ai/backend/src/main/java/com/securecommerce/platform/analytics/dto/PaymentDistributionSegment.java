package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record PaymentDistributionSegment(
        String label,
        long count,
        BigDecimal amount,
        double percentage,
        String color
) {}

