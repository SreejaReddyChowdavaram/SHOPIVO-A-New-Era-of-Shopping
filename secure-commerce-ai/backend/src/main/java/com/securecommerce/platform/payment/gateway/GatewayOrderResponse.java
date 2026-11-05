package com.securecommerce.platform.payment.gateway;

import lombok.Builder;

@Builder
public record GatewayOrderResponse(
        String gatewayOrderId,
        Long amountInPaise,
        String currency,
        String keyId,
        String status,
        String receipt
) {}
