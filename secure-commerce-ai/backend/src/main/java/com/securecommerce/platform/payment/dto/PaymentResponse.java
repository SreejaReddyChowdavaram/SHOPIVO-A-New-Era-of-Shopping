package com.securecommerce.platform.payment.dto;

import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentMethod;
import com.securecommerce.platform.payment.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * PaymentResponse — Safe client-facing payment transaction summary DTO.
 * Excludes all sensitive payment credentials and raw cryptographic signatures.
 */
public record PaymentResponse(
        Long id,
        Long orderId,
        Long customerId,
        PaymentMethod paymentMethod,
        String gatewayMethod,
        PaymentStatus paymentStatus,
        String transactionId,
        BigDecimal amount,
        String provider,
        String paymentGateway,
        String providerOrderId,
        String providerPaymentId,
        Boolean providerSignatureVerified,
        String refundProviderId,
        String cardLast4,
        String upiIdSnapshot,
        String failureReason,
        Instant createdAt,
        Instant updatedAt
) {
    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getOrder() != null ? p.getOrder().getId() : null,
                p.getCustomer() != null ? p.getCustomer().getId() : null,
                p.getPaymentMethod(),
                p.getGatewayMethod(),
                p.getPaymentStatus(),
                p.getTransactionId(),
                p.getAmount(),
                p.getProvider(),
                p.getPaymentGateway(),
                p.getProviderOrderId(),
                p.getProviderPaymentId(),
                p.getProviderSignatureVerified(),
                p.getRefundProviderId(),
                p.getCardLast4(),
                p.getUpiIdSnapshot(),
                p.getFailureReason(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
