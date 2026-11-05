package com.securecommerce.platform.payment.entity;

import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Payment.java — JPA Entity mapped to the `payments` table.
 *
 * Captures payment transaction events, gateway integration metadata, and audit records.
 * Sensitive payment information (full card PAN, CVV, passwords) is NEVER stored.
 * Raw payment signatures are verified server-side and never stored in the database.
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    /**
     * Actual instrument returned by Razorpay (e.g. card, upi, netbanking).
     */
    @Column(name = "gateway_method", length = 30)
    private String gatewayMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PaymentStatus paymentStatus;

    @Column(name = "transaction_id", nullable = false, unique = true, length = 100)
    private String transactionId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /**
     * Provider identifier: HISTORICAL_DEMO, RAZORPAY, COD.
     */
    @Column(name = "provider", nullable = false, length = 50)
    @Builder.Default
    private String provider = "RAZORPAY";

    @Column(name = "payment_gateway", nullable = false, length = 50)
    @Builder.Default
    private String paymentGateway = "RAZORPAY";

    @Column(name = "provider_order_id", length = 100)
    private String providerOrderId;

    @Column(name = "provider_payment_id", length = 100)
    private String providerPaymentId;

    @Column(name = "provider_signature_verified", nullable = false)
    @Builder.Default
    private Boolean providerSignatureVerified = false;

    @Column(name = "refund_provider_id", length = 100)
    private String refundProviderId;

    @Column(name = "card_last4", length = 4)
    private String cardLast4;

    @Column(name = "upi_id_snapshot", length = 100)
    private String upiIdSnapshot;

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
