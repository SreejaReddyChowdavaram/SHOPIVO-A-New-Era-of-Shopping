package com.securecommerce.platform.coupon.repository;

import com.securecommerce.platform.coupon.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    @Query("SELECT c FROM Coupon c WHERE c.active = true AND (c.expiresAt IS NULL OR c.expiresAt > CURRENT_TIMESTAMP) ORDER BY c.discountValue DESC")
    List<Coupon> findActiveCoupons();
}
