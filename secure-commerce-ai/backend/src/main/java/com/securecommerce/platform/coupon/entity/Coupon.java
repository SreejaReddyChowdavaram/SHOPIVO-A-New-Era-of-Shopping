package com.securecommerce.platform.coupon.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 30)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "minimum_order_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal minimumOrderAmount = BigDecimal.ZERO;

    @Column(name = "maximum_discount_amount", precision = 12, scale = 2)
    private BigDecimal maximumDiscountAmount;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "per_customer_limit")
    @Builder.Default
    private Integer perCustomerLimit = 1;

    @Column(name = "used_count")
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "start_at")
    private Instant startAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
