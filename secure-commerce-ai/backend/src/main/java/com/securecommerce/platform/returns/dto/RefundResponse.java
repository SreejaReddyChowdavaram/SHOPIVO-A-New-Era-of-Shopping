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
        String paymentMethod,
        Instant processedAt,
        Instant createdAt
) {
    public static RefundResponse from(Refund refund) {
        if (refund == null) return null;
        return new RefundResponse(
                refund.getId(),
                refund.getReturnRequest() != null ? refund.getReturnRequest().getId() : null,
                refund.getOrder() != null ? refund.getOrder().getId() : null,
                refund.getPayment() != null ? refund.getPayment().getId() : null,
                refund.getRefundAmount(),
                refund.getRefundStatus().name(),
                refund.getRefundTransactionId(),
                refund.getPaymentMethod() != null ? refund.getPaymentMethod().name() : "N/A",
                refund.getProcessedAt(),
                refund.getCreatedAt()
        );
    }
}
