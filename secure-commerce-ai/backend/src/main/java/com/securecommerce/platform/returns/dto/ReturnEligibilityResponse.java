package com.securecommerce.platform.returns.dto;

import java.math.BigDecimal;

public record ReturnEligibilityResponse(
        boolean eligible,
        String reason,
        boolean alreadyReturned,
        ReturnResponse activeReturn,
        BigDecimal estimatedRefundAmount
) {}
