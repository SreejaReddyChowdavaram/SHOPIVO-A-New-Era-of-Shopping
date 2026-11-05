package com.securecommerce.platform.order.dto;

import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.payment.entity.PaymentMethod;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import com.securecommerce.platform.returns.entity.RefundStatus;
import com.securecommerce.platform.returns.entity.ReturnStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * AdminOrderDetailResponse — Comprehensive platform view of an order for Administrator operations.
 * Encompasses customer, shipping snapshot, mixed-seller line items, seller breakdowns, payments, and returns/refunds.
 */
public record AdminOrderDetailResponse(
        Long id,
        OrderStatus status,
        Instant createdAt,
        Instant updatedAt,
        String cancellationReason,
        Instant cancelledAt,

        // Customer
        Long customerId,
        String customerName,
        String customerEmail,

        // Shipping
        OrderResponse.ShippingAddressSnapshot shippingAddress,

        // Financials
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        String couponCode,
        BigDecimal totalAmount,
        int totalItems,

        // Line items with seller metadata
        List<AdminOrderItemResponse> items,

        // Mixed-seller breakdown
        List<SellerBreakdownResponse> sellerBreakdown,

        // Payment Details (Safe audit metadata)
        PaymentDetailResponse payment,

        // Post-Order Lifecycle
        List<ReturnSnapshotResponse> returns,
        List<RefundSnapshotResponse> refunds
) {

    public record AdminOrderItemResponse(
            Long id,
            Long productId,
            String productName,
            String imageUrl,
            Long sellerId,
            String sellerName,
            String sellerEmail,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal lineTotal
    ) {}

    public record SellerBreakdownResponse(
            Long sellerId,
            String sellerName,
            String sellerEmail,
            int itemCount,
            BigDecimal subtotal
    ) {}

    public record PaymentDetailResponse(
            Long id,
            PaymentStatus paymentStatus,
            PaymentMethod paymentMethod,
            String transactionId,
            String paymentGateway,
            String cardLast4,
            String upiIdSnapshot,
            String failureReason,
            Instant paidAt
    ) {}

    public record ReturnSnapshotResponse(
            Long id,
            Long orderItemId,
            String reason,
            String returnNote,
            ReturnStatus status,
            BigDecimal refundAmount,
            Instant requestedAt,
            Instant completedAt
    ) {}

    public record RefundSnapshotResponse(
            Long id,
            RefundStatus refundStatus,
            BigDecimal refundAmount,
            String refundTransactionId,
            PaymentMethod paymentMethod,
            Instant processedAt
    ) {}
}
