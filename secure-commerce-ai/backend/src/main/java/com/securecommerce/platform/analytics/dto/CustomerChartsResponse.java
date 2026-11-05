package com.securecommerce.platform.analytics.dto;

import java.util.List;

public record CustomerChartsResponse(
        List<MonthlyPurchasePoint> monthlyPurchases,
        List<StatusDistributionSegment> orderStatusDistribution,
        List<MonthlyPurchasePoint> spendingAnalysis,
        List<PurchaseVsReturnPoint> purchaseVsReturns
) {}

