package com.securecommerce.platform.coupon.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.coupon.dto.CouponResponse;
import com.securecommerce.platform.coupon.dto.CouponValidationResponse;
import com.securecommerce.platform.coupon.dto.ValidateCouponRequest;
import com.securecommerce.platform.coupon.service.CouponService;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    /**
     * Customer validates a coupon against their current cart subtotal.
     * Calculates discount and payable total authoritatively on the backend.
     */
    @PostMapping("/validate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validateCoupon(
            @Valid @RequestBody ValidateCouponRequest request,
            @AuthenticationPrincipal User currentUser) {
        CouponValidationResponse response = couponService.validateCoupon(request.code(), currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Coupon validation evaluated", response));
    }

    /**
     * Retrieves active, non-expired coupons for customer awareness during checkout.
     */
    @GetMapping("/available")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getAvailableCoupons() {
        List<CouponResponse> coupons = couponService.getAvailableCoupons();
        return ResponseEntity.ok(ApiResponse.success("Available coupons retrieved", coupons));
    }
}
