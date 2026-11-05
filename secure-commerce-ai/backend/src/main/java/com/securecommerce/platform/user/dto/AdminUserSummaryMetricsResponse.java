package com.securecommerce.platform.user.dto;

/**
 * AdminUserSummaryMetricsResponse — Platform user operational metrics for Admin dashboard.
 */
public record AdminUserSummaryMetricsResponse(
        long totalUsers,
        long totalCustomers,
        long totalSellers,
        long activeSellers,
        long suspendedUsers
) {}
