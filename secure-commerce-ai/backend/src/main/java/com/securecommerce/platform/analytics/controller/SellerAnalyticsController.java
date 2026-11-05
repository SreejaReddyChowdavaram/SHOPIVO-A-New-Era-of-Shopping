package com.securecommerce.platform.analytics.controller;

import com.securecommerce.platform.analytics.dto.*;
import com.securecommerce.platform.analytics.service.SellerAnalyticsService;
import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * SellerAnalyticsController — REST endpoints for seller sales analytics and overview.
 * All operations are strictly scoped to the authenticated seller identity from JWT context.
 * Base path: /seller/analytics (mapped under /api/seller/analytics)
 */
@RestController
@RequestMapping("/seller/analytics")
@RequiredArgsConstructor
public class SellerAnalyticsController {

    private final SellerAnalyticsService sellerAnalyticsService;

    /**
     * GET /api/seller/analytics/overview?range={today|7d|30d|this_month|last_month|this_year|all|custom}&startDate=...&endDate=...
     */
    @GetMapping("/overview")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<SellerAnalyticsOverviewResponse>> getOverview(
            @RequestParam(required = false, defaultValue = "all") String range,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @AuthenticationPrincipal User currentUser) {
        DateRange dateRange = DateRangeResolver.resolve(range, startDate, endDate);
        SellerAnalyticsOverviewResponse overview = sellerAnalyticsService.getOverview(currentUser.getId(), dateRange);
        return ResponseEntity.ok(ApiResponse.success("Seller analytics overview retrieved", overview));
    }

    /**
     * GET /api/seller/analytics/charts?range={today|7d|30d|this_month|last_month|this_year|all|custom}&startDate=...&endDate=...
     */
    @GetMapping("/charts")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<SellerChartsResponse>> getCharts(
            @RequestParam(required = false, defaultValue = "all") String range,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @AuthenticationPrincipal User currentUser) {
        DateRange dateRange = DateRangeResolver.resolve(range, startDate, endDate);
        SellerChartsResponse charts = sellerAnalyticsService.getCharts(currentUser.getId(), dateRange);
        return ResponseEntity.ok(ApiResponse.success("Seller charts retrieved", charts));
    }

    /**
     * GET /api/seller/analytics/recent-orders?limit=10
     */
    @GetMapping("/recent-orders")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<List<SellerRecentOrderResponse>>> getRecentOrders(
            @RequestParam(required = false, defaultValue = "10") int limit,
            @AuthenticationPrincipal User currentUser) {
        List<SellerRecentOrderResponse> recentOrders = sellerAnalyticsService.getRecentOrders(currentUser.getId(), limit);
        return ResponseEntity.ok(ApiResponse.success("Seller recent orders retrieved", recentOrders));
    }

    /**
     * GET /api/seller/analytics/summary?range={7d|30d|all}
     * Returns high-level metrics: totalOrders, completedOrders, cancelledOrders, unitsSold, grossSales, refundedAmount.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<SellerAnalyticsSummaryResponse>> getSummary(
            @RequestParam(required = false, defaultValue = "all") String range,
            @AuthenticationPrincipal User currentUser) {
        SellerAnalyticsSummaryResponse summary = sellerAnalyticsService.getSummary(currentUser.getId(), range);
        return ResponseEntity.ok(ApiResponse.success("Seller analytics summary retrieved", summary));
    }

    /**
     * GET /api/seller/analytics/sales?range={7d|30d|all}
     * Returns daily time-series data for chart rendering.
     */
    @GetMapping("/sales")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<List<DailySalesPoint>>> getSalesTrend(
            @RequestParam(required = false, defaultValue = "7d") String range,
            @AuthenticationPrincipal User currentUser) {
        List<DailySalesPoint> trend = sellerAnalyticsService.getSalesTrend(currentUser.getId(), range);
        return ResponseEntity.ok(ApiResponse.success("Seller sales trend retrieved", trend));
    }

    /**
     * GET /api/seller/analytics/top-products?range={7d|30d|all}&limit=5
     * Returns top selling products for this seller ranked by units sold.
     */
    @GetMapping("/top-products")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<List<TopSellingProductResponse>>> getTopProducts(
            @RequestParam(required = false, defaultValue = "all") String range,
            @RequestParam(required = false, defaultValue = "5") int limit,
            @AuthenticationPrincipal User currentUser) {
        List<TopSellingProductResponse> topProducts = sellerAnalyticsService.getTopProducts(currentUser.getId(), range, limit);
        return ResponseEntity.ok(ApiResponse.success("Seller top products retrieved", topProducts));
    }
}

