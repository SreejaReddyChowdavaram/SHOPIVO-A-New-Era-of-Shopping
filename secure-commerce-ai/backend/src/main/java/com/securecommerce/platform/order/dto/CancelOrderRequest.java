package com.securecommerce.platform.order.dto;

import jakarta.validation.constraints.Size;

/**
 * CancelOrderRequest — Input DTO for customer or admin order cancellation.
 */
public record CancelOrderRequest(
        @Size(max = 255, message = "Cancellation reason must not exceed 255 characters")
        String reason
) {}
