package com.securecommerce.platform.analytics.controller;

import com.securecommerce.platform.analytics.dto.*;
import com.securecommerce.platform.analytics.service.CustomerAnalyticsService;
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

/**
 * CustomerAnalyticsController — REST endpoints for customer personal analytics and dashboard.
 * All queries are strictly scoped to the authenticated customer from JWT context.
 * Base path: /customer/analytics (mapped under /api/customer/analytics)
 */
@RestController
@RequestMapping("/customer/analytics")
@RequiredArgsConstructor
public class CustomerAnalyticsController {

    private final CustomerAnalyticsService customerAnalyticsService;

    /**
     * GET /api/customer/analytics/overview?range={today|7d|30d|this_month|last_month|this_year|all|custom}&startDate=...&endDate=...
     */
    @GetMapping("/overview")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerAnalyticsOverviewResponse>> getOverview(
            @RequestParam(required = false, defaultValue = "all") String range,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @AuthenticationPrincipal User currentUser) {
        DateRange dateRange = DateRangeResolver.resolve(range, startDate, endDate);
        CustomerAnalyticsOverviewResponse overview = customerAnalyticsService.getOverview(currentUser.getId(), dateRange);
        return ResponseEntity.ok(ApiResponse.success("Customer analytics overview retrieved", overview));
    }

    /**
     * GET /api/customer/analytics/charts?range={today|7d|30d|this_month|last_month|this_year|all|custom}&startDate=...&endDate=...
     */
    @GetMapping("/charts")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerChartsResponse>> getCharts(
            @RequestParam(required = false, defaultValue = "all") String range,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @AuthenticationPrincipal User currentUser) {
        DateRange dateRange = DateRangeResolver.resolve(range, startDate, endDate);
        CustomerChartsResponse charts = customerAnalyticsService.getCharts(currentUser.getId(), dateRange);
        return ResponseEntity.ok(ApiResponse.success("Customer charts retrieved", charts));
    }

    /**
     * GET /api/customer/analytics/recent-activity
     */
    @GetMapping("/recent-activity")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerRecentActivityResponse>> getRecentActivity(
            @AuthenticationPrincipal User currentUser) {
        CustomerRecentActivityResponse recentActivity = customerAnalyticsService.getRecentActivity(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Customer recent activity retrieved", recentActivity));
    }
}

