package com.securecommerce.platform.returns.entity;

import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentMethod;
import com.securecommerce.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "refunds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "return_id", nullable = false)
    private ReturnRequest returnRequest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(name = "refund_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", nullable = false, length = 30)
    @Builder.Default
    private RefundStatus refundStatus = RefundStatus.PENDING;

    @Column(name = "refund_transaction_id", nullable = false, unique = true, length = 100)
    private String refundTransactionId;

    @Column(name = "provider_refund_id", length = 100)
    private String providerRefundId;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "destination")
    private String destination;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Column(name = "processed_at")
    private Instant processedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
