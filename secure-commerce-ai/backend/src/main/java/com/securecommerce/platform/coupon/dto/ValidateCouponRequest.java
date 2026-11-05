package com.securecommerce.platform.coupon.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record ValidateCouponRequest(
        @NotBlank(message = "Coupon code is required")
        String code,
        BigDecimal subtotal
) {
}
