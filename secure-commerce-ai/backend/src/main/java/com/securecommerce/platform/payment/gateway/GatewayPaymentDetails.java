package com.securecommerce.platform.payment.gateway;

import lombok.Builder;

@Builder
public record GatewayPaymentDetails(
        String paymentId,
        String orderId,
        Long amountInPaise,
        String currency,
        String status, // captured, authorized, failed
        String method, // card, upi, netbanking
        String cardLast4,
        String vpa,
        String bank,
        String errorDescription
) {}
