package com.securecommerce.platform.analytics.dto;

import java.util.List;

public record AdminChartsResponse(
        List<MonthlyOrderPoint> platformOrderTrends,
        List<MonthlyGmvPoint> monthlyGmv,
        List<StatusDistributionSegment> orderStatusDistribution,
        List<MonthlyGrowthPoint> customerGrowth,
        List<SellerPerformancePoint> sellerPerformance,
        List<AdminTopProductPoint> productPerformance,
        List<AdminPurchaseVsReturnPoint> purchaseVsReturns,
        List<PaymentDistributionSegment> paymentDistribution
) {}

