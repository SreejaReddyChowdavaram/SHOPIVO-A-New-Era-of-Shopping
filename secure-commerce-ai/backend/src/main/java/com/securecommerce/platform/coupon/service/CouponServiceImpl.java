package com.securecommerce.platform.coupon.service;

import com.securecommerce.platform.cart.entity.Cart;
import com.securecommerce.platform.cart.entity.CartItem;
import com.securecommerce.platform.cart.repository.CartRepository;
import com.securecommerce.platform.coupon.dto.CouponResponse;
import com.securecommerce.platform.coupon.dto.CouponValidationResponse;
import com.securecommerce.platform.coupon.entity.Coupon;
import com.securecommerce.platform.coupon.entity.CouponUsage;
import com.securecommerce.platform.coupon.entity.DiscountType;
import com.securecommerce.platform.coupon.repository.CouponRepository;
import com.securecommerce.platform.coupon.repository.CouponUsageRepository;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CartRepository cartRepository;

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(String code, Long customerId) {
        if (code == null || code.trim().isEmpty()) {
            return CouponValidationResponse.invalid(code, "Please enter a valid coupon code");
        }

        // 1. Calculate authoritative subtotal directly from customer's cart
        Cart cart = cartRepository.findByUserId(customerId)
                .orElse(null);

        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            return CouponValidationResponse.invalid(code, "Your cart is empty");
        }

        BigDecimal subtotal = cart.getItems().stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return validateCouponForAmount(code, subtotal, customerId);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCouponForAmount(String code, BigDecimal subtotal, Long customerId) {
        if (code == null || code.trim().isEmpty()) {
            return CouponValidationResponse.invalid(code, "Please enter a valid coupon code");
        }

        if (subtotal == null || subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return CouponValidationResponse.invalid(code, "Order subtotal must be greater than zero");
        }

        String normalizedCode = code.trim().toUpperCase();
        Optional<Coupon> optionalCoupon = couponRepository.findByCodeIgnoreCase(normalizedCode);

        if (optionalCoupon.isEmpty()) {
            return CouponValidationResponse.invalid(normalizedCode, String.format("Coupon '%s' not found", normalizedCode));
        }

        Coupon coupon = optionalCoupon.get();
        Instant now = Instant.now();

        // Check active status
        if (!coupon.isActive()) {
            return CouponValidationResponse.invalid(normalizedCode, "This coupon is no longer active");
        }

        // Check date validity
        if (coupon.getStartAt() != null && now.isBefore(coupon.getStartAt())) {
            return CouponValidationResponse.invalid(normalizedCode, "This coupon is not active yet");
        }

        if (coupon.getExpiresAt() != null && now.isAfter(coupon.getExpiresAt())) {
            return CouponValidationResponse.invalid(normalizedCode, "This coupon has expired");
        }

        // Check minimum order amount
        if (coupon.getMinimumOrderAmount() != null && subtotal.compareTo(coupon.getMinimumOrderAmount()) < 0) {
            return CouponValidationResponse.invalid(
                    normalizedCode,
                    String.format("Minimum order value of ₹%s required to apply this coupon (Current: ₹%s)",
                            coupon.getMinimumOrderAmount().setScale(0, RoundingMode.HALF_UP),
                            subtotal.setScale(0, RoundingMode.HALF_UP))
            );
        }

        // Check total usage limit
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            return CouponValidationResponse.invalid(normalizedCode, "Coupon total usage limit has been reached");
        }

        // Check per-customer usage limit
        if (customerId != null && coupon.getPerCustomerLimit() != null) {
            long customerUsageCount = couponUsageRepository.countByCouponIdAndCustomerId(coupon.getId(), customerId);
            if (customerUsageCount >= coupon.getPerCustomerLimit()) {
                return CouponValidationResponse.invalid(normalizedCode, "You have already reached the maximum usage limit for this coupon");
            }
        }

        // Calculate authoritative discount
        BigDecimal discountAmount = calculateDiscount(coupon, subtotal);
        BigDecimal finalAmount = subtotal.subtract(discountAmount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        return new CouponValidationResponse(
                true,
                coupon.getCode(),
                String.format("Coupon '%s' applied successfully!", coupon.getCode()),
                coupon.getDiscountType(),
                coupon.getDiscountValue(),
                discountAmount,
                subtotal.setScale(2, RoundingMode.HALF_UP),
                finalAmount
        );
    }

    @Override
    public BigDecimal calculateAuthoritativeDiscount(String code, BigDecimal subtotal, Long customerId) {
        if (code == null || code.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }

        CouponValidationResponse response = validateCouponForAmount(code, subtotal, customerId);
        if (!response.valid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, response.message());
        }

        return response.discountAmount();
    }

    @Override
    public void recordCouponUsage(String code, Order order, User customer, BigDecimal discountApplied) {
        if (code == null || code.trim().isEmpty() || discountApplied == null || discountApplied.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        String normalizedCode = code.trim().toUpperCase();
        Coupon coupon = couponRepository.findByCodeIgnoreCase(normalizedCode)
                .orElse(null);

        if (coupon == null) {
            log.warn("Coupon {} not found while recording usage for order {}", normalizedCode, order.getId());
            return;
        }

        // Check duplicate usage for the same order
        if (couponUsageRepository.existsByCouponIdAndOrderId(coupon.getId(), order.getId())) {
            log.warn("Coupon usage already recorded for coupon {} and order {}", coupon.getCode(), order.getId());
            return;
        }

        CouponUsage usage = CouponUsage.builder()
                .coupon(coupon)
                .customer(customer)
                .order(order)
                .discountApplied(discountApplied)
                .build();

        couponUsageRepository.save(usage);

        // Increment usage count
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);

        log.info("Coupon usage recorded: coupon={}, customerId={}, orderId={}, discount={}",
                coupon.getCode(), customer.getId(), order.getId(), discountApplied);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponResponse> getAvailableCoupons() {
        return couponRepository.findActiveCoupons()
                .stream()
                .map(CouponResponse::from)
                .toList();
    }

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        BigDecimal discount;
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = subtotal.multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            if (coupon.getMaximumDiscountAmount() != null && discount.compareTo(coupon.getMaximumDiscountAmount()) > 0) {
                discount = coupon.getMaximumDiscountAmount();
            }
        } else {
            discount = coupon.getDiscountValue();
        }

        // Discount cannot exceed subtotal
        return discount.min(subtotal).setScale(2, RoundingMode.HALF_UP);
    }
}
