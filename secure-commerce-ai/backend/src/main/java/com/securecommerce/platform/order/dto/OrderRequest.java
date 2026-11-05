package com.securecommerce.platform.order.dto;

import jakarta.validation.constraints.NotNull;

public record OrderRequest(
        @NotNull(message = "Shipping address ID is required")
        Long addressId,
        String couponCode
) {}
