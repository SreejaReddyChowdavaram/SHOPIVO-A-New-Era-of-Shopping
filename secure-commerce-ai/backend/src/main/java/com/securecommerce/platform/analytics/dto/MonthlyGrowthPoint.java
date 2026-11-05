package com.securecommerce.platform.analytics.dto;

public record MonthlyGrowthPoint(
        String month,
        long newCustomers,
        long newSellers
) {}
