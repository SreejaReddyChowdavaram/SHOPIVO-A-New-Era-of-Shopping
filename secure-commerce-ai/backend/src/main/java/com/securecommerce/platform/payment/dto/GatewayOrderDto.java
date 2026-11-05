package com.securecommerce.platform.payment.dto;

import java.math.BigDecimal;

public record GatewayOrderDto(
        Long orderId,
        String gatewayOrderId,
        BigDecimal amount,
        Long amountInPaise,
        String currency,
        String keyId,
        String customerName,
        String customerEmail,
        String customerPhone
) {}
