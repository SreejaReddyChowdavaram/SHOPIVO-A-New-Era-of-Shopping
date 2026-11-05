package com.securecommerce.platform.payment.dto;

import jakarta.validation.constraints.NotNull;

public record CreateGatewayOrderRequest(
        @NotNull(message = "Order ID is required")
        Long orderId
) {}
