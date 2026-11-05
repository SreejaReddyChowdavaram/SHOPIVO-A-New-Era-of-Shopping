package com.securecommerce.platform.analytics.dto;

public record StatusDistributionSegment(
        String status,
        long count,
        double percentage,
        String color
) {}

