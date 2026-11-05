package com.securecommerce.platform.coupon.repository;

import com.securecommerce.platform.coupon.entity.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {

    long countByCouponIdAndCustomerId(Long couponId, Long customerId);

    List<CouponUsage> findByCustomerId(Long customerId);

    boolean existsByCouponIdAndOrderId(Long couponId, Long orderId);
}
