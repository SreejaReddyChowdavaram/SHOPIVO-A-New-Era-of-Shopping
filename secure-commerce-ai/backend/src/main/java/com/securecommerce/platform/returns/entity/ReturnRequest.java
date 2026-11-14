package com.securecommerce.platform.returns.entity;

import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderItem;
import com.securecommerce.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "return_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private User seller;

    @Column(name = "seller_approval_status", length = 50)
    @Builder.Default
    private String sellerApprovalStatus = "PENDING_SELLER_APPROVAL";

    @Column(name = "seller_approved_at")
    private Instant sellerApprovedAt;

    @Column(name = "seller_rejected_at")
    private Instant sellerRejectedAt;

    @Column(name = "seller_rejection_reason", columnDefinition = "TEXT")
    private String sellerRejectionReason;

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(name = "return_note", columnDefinition = "TEXT")
    private String returnNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ReturnStatus status = ReturnStatus.REQUESTED;

    @Column(name = "refund_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @CreationTimestamp
    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
