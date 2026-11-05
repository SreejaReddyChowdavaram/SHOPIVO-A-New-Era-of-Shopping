package com.securecommerce.platform.coupon.dto;

import com.securecommerce.platform.coupon.entity.DiscountType;

import java.math.BigDecimal;

public record CouponValidationResponse(
        boolean valid,
        String code,
        String message,
        DiscountType discountType,
        BigDecimal discountValue,
        BigDecimal discountAmount,
        BigDecimal subtotal,
        BigDecimal finalAmount
) {
    public static CouponValidationResponse invalid(String code, String message) {
        return new CouponValidationResponse(
                false,
                code != null ? code.toUpperCase() : null,
                message,
                null,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );
    }
}
