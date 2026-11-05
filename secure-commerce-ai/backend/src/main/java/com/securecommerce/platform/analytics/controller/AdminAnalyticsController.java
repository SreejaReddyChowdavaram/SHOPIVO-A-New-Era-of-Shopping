package com.securecommerce.platform.analytics.controller;

import com.securecommerce.platform.analytics.dto.AdminAnalyticsOverviewResponse;
import com.securecommerce.platform.analytics.dto.AdminChartsResponse;
import com.securecommerce.platform.analytics.dto.AdminRecentActivityResponse;
import com.securecommerce.platform.analytics.dto.DateRange;
import com.securecommerce.platform.analytics.dto.DateRangeResolver;
import com.securecommerce.platform.analytics.service.AdminAnalyticsService;
import com.securecommerce.platform.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * AdminAnalyticsController — REST endpoints for platform-wide analytics and admin dashboard.
 * Guarded strictly by ADMIN role authorization.
 * Base path: /admin/analytics (mapped under /api/admin/analytics)
 */
@RestController
@RequestMapping("/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    /**
     * GET /api/admin/analytics/overview?range={today|7d|30d|this_month|last_month|this_year|all|custom}&startDate=...&endDate=...
     */
    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminAnalyticsOverviewResponse>> getOverview(
            @RequestParam(required = false, defaultValue = "all") String range,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        DateRange dateRange = DateRangeResolver.resolve(range, startDate, endDate);
        AdminAnalyticsOverviewResponse overview = adminAnalyticsService.getOverview(dateRange);
        return ResponseEntity.ok(ApiResponse.success("Admin analytics overview retrieved", overview));
    }

    /**
     * GET /api/admin/analytics/charts?range={today|7d|30d|this_month|last_month|this_year|all|custom}&startDate=...&endDate=...
     */
    @GetMapping("/charts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminChartsResponse>> getCharts(
            @RequestParam(required = false, defaultValue = "all") String range,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        DateRange dateRange = DateRangeResolver.resolve(range, startDate, endDate);
        AdminChartsResponse charts = adminAnalyticsService.getCharts(dateRange);
        return ResponseEntity.ok(ApiResponse.success("Admin charts retrieved", charts));
    }

    /**
     * GET /api/admin/analytics/recent-activity
     */
    @GetMapping("/recent-activity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminRecentActivityResponse>> getRecentActivity() {
        AdminRecentActivityResponse recentActivity = adminAnalyticsService.getRecentActivity();
        return ResponseEntity.ok(ApiResponse.success("Admin recent activity retrieved", recentActivity));
    }
}

