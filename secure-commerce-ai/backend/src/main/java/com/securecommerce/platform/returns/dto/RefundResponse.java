package com.securecommerce.platform.returns.dto;

import com.securecommerce.platform.returns.entity.Refund;

import java.math.BigDecimal;
import java.time.Instant;

public record RefundResponse(
        Long id,
        Long returnId,
        Long orderId,
        Long paymentId,
        BigDecimal refundAmount,
        String refundStatus,
        String refundTransactionId,
        String providerRefundId,
        String paymentMethod,
        String destination,
        String estimatedSettlement,
        String failureReason,
        Instant processedAt,
        Instant createdAt
) {
    public static RefundResponse from(Refund refund) {
        if (refund == null) return null;

        String dest = refund.getDestination();
        if (dest == null || dest.isBlank()) {
            dest = "Original payment method (" + (refund.getPaymentMethod() != null ? refund.getPaymentMethod().name() : "UPI / Card") + ")";
        }

        String est = "Typically 5-7 business days for Cards/NetBanking, Instant to 24 hrs for UPI";

        return new RefundResponse(
                refund.getId(),
                refund.getReturnRequest() != null ? refund.getReturnRequest().getId() : null,
                refund.getOrder() != null ? refund.getOrder().getId() : null,
                refund.getPayment() != null ? refund.getPayment().getId() : null,
                refund.getRefundAmount(),
                refund.getRefundStatus().name(),
                refund.getRefundTransactionId(),
                refund.getProviderRefundId(),
                refund.getPaymentMethod() != null ? refund.getPaymentMethod().name() : "N/A",
                dest,
                est,
                refund.getFailureReason(),
                refund.getProcessedAt(),
                refund.getCreatedAt()
        );
    }
}
