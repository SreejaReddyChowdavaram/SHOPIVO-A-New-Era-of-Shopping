package com.securecommerce.platform.analytics.service;

import com.securecommerce.platform.analytics.dto.AdminAnalyticsOverviewResponse;
import com.securecommerce.platform.analytics.dto.AdminChartsResponse;
import com.securecommerce.platform.analytics.dto.AdminRecentActivityResponse;
import com.securecommerce.platform.analytics.dto.DateRange;

/**
 * AdminAnalyticsService — Platform-wide analytics aggregation and metrics reporting.
 */
public interface AdminAnalyticsService {

    /**
     * Retrieves high-level platform summary metrics filtered by date range.
     */
    AdminAnalyticsOverviewResponse getOverview(DateRange range);

    /**
     * Retrieves all chart series (orders, GMV, status donut, user growth, seller performance, top products, payment breakdown).
     */
    AdminChartsResponse getCharts(DateRange range);

    /**
     * Retrieves recent platform activity records (orders, new users, returns).
     */
    AdminRecentActivityResponse getRecentActivity();
}

