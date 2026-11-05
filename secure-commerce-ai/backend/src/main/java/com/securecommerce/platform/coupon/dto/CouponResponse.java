package com.securecommerce.platform.coupon.dto;

import com.securecommerce.platform.coupon.entity.Coupon;
import com.securecommerce.platform.coupon.entity.DiscountType;

import java.math.BigDecimal;
import java.time.Instant;

public record CouponResponse(
        Long id,
        String code,
        String description,
        DiscountType discountType,
        BigDecimal discountValue,
        BigDecimal minimumOrderAmount,
        BigDecimal maximumDiscountAmount,
        Instant expiresAt,
        boolean active
) {
    public static CouponResponse from(Coupon coupon) {
        if (coupon == null) return null;
        return new CouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getDescription(),
                coupon.getDiscountType(),
                coupon.getDiscountValue(),
                coupon.getMinimumOrderAmount(),
                coupon.getMaximumDiscountAmount(),
                coupon.getExpiresAt(),
                coupon.isActive()
        );
    }
}
