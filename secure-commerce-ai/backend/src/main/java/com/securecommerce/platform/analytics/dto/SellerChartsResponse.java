package com.securecommerce.platform.analytics.dto;

import java.util.List;

public record SellerChartsResponse(
        List<MonthlySalesPoint> monthlySales,
        List<MonthlySalesPoint> ordersReceived,
        List<StatusDistributionSegment> orderStatusDistribution,
        List<TopSellingProductResponse> topProducts,
        List<SalesVsReturnPoint> salesVsReturns,
        List<MonthlySalesPoint> revenueOverview
) {}
