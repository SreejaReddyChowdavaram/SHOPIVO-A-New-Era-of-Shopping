package com.securecommerce.platform.order.entity;

import com.securecommerce.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    // Snapshot address fields directly on the order for immutable record-keeping
    @Column(name = "shipping_full_name", nullable = false, length = 150)
    private String shippingFullName;

    @Column(name = "shipping_phone", nullable = false, length = 30)
    private String shippingPhone;

    @Column(name = "shipping_line1", nullable = false, length = 255)
    private String shippingLine1;

    @Column(name = "shipping_line2", length = 255)
    private String shippingLine2;

    @Column(name = "shipping_city", nullable = false, length = 100)
    private String shippingCity;

    @Column(name = "shipping_state", nullable = false, length = 100)
    private String shippingState;

    @Column(name = "shipping_postal_code", nullable = false, length = 20)
    private String shippingPostalCode;

    @Column(name = "shipping_country", nullable = false, length = 100)
    private String shippingCountry;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "subtotal_amount", precision = 12, scale = 2)
    private BigDecimal subtotalAmount;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(name = "cancellation_reason", length = 255)
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    /**
     * 30-minute payment session window for PENDING orders.
     */
    @Column(name = "payment_expires_at")
    private Instant paymentExpiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
