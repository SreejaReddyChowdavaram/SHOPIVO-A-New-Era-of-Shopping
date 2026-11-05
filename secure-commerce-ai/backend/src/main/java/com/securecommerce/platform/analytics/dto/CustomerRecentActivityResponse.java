package com.securecommerce.platform.analytics.dto;

import java.util.List;

public record CustomerRecentActivityResponse(
        List<RecentPurchaseItem> recentPurchases,
        List<RecentReturnItem> recentReturns
) {}

