package com.securecommerce.platform.analytics.dto;

public record MonthlyOrderPoint(
        String month,
        long totalOrders,
        long completedOrders,
        long cancelledOrders
) {}
