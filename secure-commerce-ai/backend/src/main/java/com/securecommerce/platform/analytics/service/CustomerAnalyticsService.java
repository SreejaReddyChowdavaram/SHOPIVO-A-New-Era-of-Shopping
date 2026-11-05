package com.securecommerce.platform.analytics.service;

import com.securecommerce.platform.analytics.dto.CustomerAnalyticsOverviewResponse;
import com.securecommerce.platform.analytics.dto.CustomerChartsResponse;
import com.securecommerce.platform.analytics.dto.CustomerRecentActivityResponse;
import com.securecommerce.platform.analytics.dto.DateRange;

public interface CustomerAnalyticsService {

    CustomerAnalyticsOverviewResponse getOverview(Long customerId, DateRange range);

    CustomerChartsResponse getCharts(Long customerId, DateRange range);

    CustomerRecentActivityResponse getRecentActivity(Long customerId);
}

