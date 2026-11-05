package com.securecommerce.platform.payment.gateway;

import lombok.Builder;

@Builder
public record GatewayRefundResponse(
        String refundId,
        String paymentId,
        Long amountInPaise,
        String currency,
        String status, // processed, processing, failed
        String speedProcessed
) {}
