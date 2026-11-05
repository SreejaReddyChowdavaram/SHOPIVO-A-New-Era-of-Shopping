package com.securecommerce.platform.analytics.dto;

import java.math.BigDecimal;

public record PurchaseVsReturnPoint(
        String month,
        long purchasedOrders,
        long returnedOrders,
        BigDecimal purchaseAmount,
        BigDecimal refundAmount
) {}

