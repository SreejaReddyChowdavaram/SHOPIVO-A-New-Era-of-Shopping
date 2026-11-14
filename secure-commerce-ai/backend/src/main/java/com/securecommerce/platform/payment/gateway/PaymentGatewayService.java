package com.securecommerce.platform.payment.gateway;

import java.math.BigDecimal;

/**
 * PaymentGatewayService — Provider-agnostic payment gateway abstraction.
 *
 * Decouples core business services from direct payment provider APIs.
 */
public interface PaymentGatewayService {

    GatewayOrderResponse createOrder(Long orderId, BigDecimal amount, String currency, String receipt);

    boolean verifyPaymentSignature(String orderId, String paymentId, String signature);

    boolean verifyWebhookSignature(String requestBody, String signature);

    GatewayPaymentDetails fetchPayment(String paymentId);

    GatewayPaymentDetails capturePayment(String paymentId, Long amountInPaise, String currency);

    GatewayRefundResponse refundPayment(String paymentId, BigDecimal amount, String reason);

    default GatewayRefundResponse refundPayment(String paymentId, BigDecimal amount, String reason, String receipt) {
        return refundPayment(paymentId, amount, reason);
    }

    default GatewayRefundResponse fetchRefund(String refundId) {
        return null;
    }

    GatewayQrCodeResponse createQrCode(Long orderId, BigDecimal amount, String currency, String description, Long closeByEpochSeconds);

    boolean closeQrCode(String qrCodeId);

    String getPublicKeyId();

    default String getMode() {
        return "TEST";
    }
}
