package com.securecommerce.platform.returns.dto;

import java.util.List;

public record SellerRefundSummaryDto(
        long totalRefundRequests,
        long pendingSellerApproval,
        long approvedRefunds,
        long rejectedRefunds,
        long successfullyRefunded,
        List<ReturnResponse> requests
) {}

