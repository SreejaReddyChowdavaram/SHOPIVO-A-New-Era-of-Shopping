package com.securecommerce.platform.user.dto;

/**
 * AdminUserSummaryMetricsResponse — Platform user operational metrics for Admin dashboard.
 */
public record AdminUserSummaryMetricsResponse(
        long totalUsers,
        long totalCustomers,
        long activeCustomers,
        long suspendedCustomers,
        long totalSellers,
        long activeSellers,
        long suspendedSellers,
        long suspendedUsers
) {}
