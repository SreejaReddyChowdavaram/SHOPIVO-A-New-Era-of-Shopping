package com.securecommerce.platform.order.dto;

import com.securecommerce.platform.order.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusUpdateRequest(
        @NotNull(message = "New order status is required")
        OrderStatus status
) {}
