package com.securecommerce.platform.coupon.service;

import com.securecommerce.platform.coupon.dto.CouponResponse;
import com.securecommerce.platform.coupon.dto.CouponValidationResponse;
import com.securecommerce.platform.coupon.entity.Coupon;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.user.entity.User;

import java.math.BigDecimal;
import java.util.List;

public interface CouponService {

    /**
     * Validates a coupon code against the authenticated customer's current cart subtotal.
     */
    CouponValidationResponse validateCoupon(String code, Long customerId);

    /**
     * Validates a coupon code against a specific subtotal amount.
     */
    CouponValidationResponse validateCouponForAmount(String code, BigDecimal subtotal, Long customerId);

    /**
     * Authoritative calculation and verification during Order placement.
     * Throws ResponseStatusException if invalid.
     */
    BigDecimal calculateAuthoritativeDiscount(String code, BigDecimal subtotal, Long customerId);

    /**
     * Records the usage of a coupon for a successfully created order.
     */
    void recordCouponUsage(String code, Order order, User customer, BigDecimal discountApplied);

    /**
     * Returns active, non-expired coupons available for customers.
     */
    List<CouponResponse> getAvailableCoupons();
}
