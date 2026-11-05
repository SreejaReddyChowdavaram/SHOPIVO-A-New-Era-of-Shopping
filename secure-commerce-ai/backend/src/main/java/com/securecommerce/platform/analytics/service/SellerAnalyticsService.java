package com.securecommerce.platform.analytics.service;

import com.securecommerce.platform.analytics.dto.DailySalesPoint;
import com.securecommerce.platform.analytics.dto.DateRange;
import com.securecommerce.platform.analytics.dto.SellerAnalyticsOverviewResponse;
import com.securecommerce.platform.analytics.dto.SellerAnalyticsSummaryResponse;
import com.securecommerce.platform.analytics.dto.SellerChartsResponse;
import com.securecommerce.platform.analytics.dto.SellerRecentOrderResponse;
import com.securecommerce.platform.analytics.dto.TopSellingProductResponse;

import java.util.List;

/**
 * SellerAnalyticsService — Domain operations for calculating seller sales, orders, and product analytics.
 */
public interface SellerAnalyticsService {

    /**
     * Aggregates summary sales metrics (total orders, completed orders, cancelled orders, units sold, gross sales, refunds)
     * strictly for order items owned by the given seller within the requested time range.
     *
     * @param sellerId authenticated seller ID
     * @param range    time range filter: "7d", "30d", or "all" (default)
     * @return summary metrics record
     */
    SellerAnalyticsSummaryResponse getSummary(Long sellerId, String range);

    /**
     * Generates a continuous daily time-series of orders, units sold, and gross sales for the given seller.
     * Zero-activity dates within fixed ranges (7d, 30d) are populated with zero values for reliable chart rendering.
     *
     * @param sellerId authenticated seller ID
     * @param range    time range filter: "7d", "30d", or "all"
     * @return list of daily data points sorted chronologically
     */
    List<DailySalesPoint> getSalesTrend(Long sellerId, String range);

    /**
     * Calculates the top-selling products for the seller ranked by actual units sold from non-cancelled orders.
     *
     * @param sellerId authenticated seller ID
     * @param range    time range filter: "7d", "30d", or "all"
     * @param limit    maximum number of products to return
     * @return list of top performing products
     */
    List<TopSellingProductResponse> getTopProducts(Long sellerId, String range, int limit);

    /**
     * Aggregates modern seller dashboard overview metrics within the specified date range.
     */
    SellerAnalyticsOverviewResponse getOverview(Long sellerId, DateRange range);

    /**
     * Generates all charts data (monthly sales, orders received, status distribution, top products, sales vs returns, revenue overview).
     */
    SellerChartsResponse getCharts(Long sellerId, DateRange range);

    /**
     * Retrieves recent orders received by this seller.
     */
    List<SellerRecentOrderResponse> getRecentOrders(Long sellerId, int limit);
}
