package com.securecommerce.platform.payment.gateway;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MockPaymentGatewayService — Explicit Mock Implementation for Integration Tests.
 *
 * ACTIVE ONLY UNDER @Profile("test").
 * Strictly prohibited from running in production or development environments.
 */
@Slf4j
@Service
@Profile("test")
public class MockPaymentGatewayService implements PaymentGatewayService {

    public static final String TEST_KEY_ID = "rzp_test_mock_1234567890";
    public static final String TEST_SECRET = "mock_secret_key_abcdef";
    public static final String TEST_WEBHOOK_SECRET = "mock_webhook_secret_xyz";

    private final Map<String, GatewayPaymentDetails> customPayments = new ConcurrentHashMap<>();
    private final Map<String, Long> orderAmounts = new ConcurrentHashMap<>();

    public void registerPaymentDetails(String paymentId, GatewayPaymentDetails details) {
        customPayments.put(paymentId, details);
    }

    public void clearMockData() {
        customPayments.clear();
        orderAmounts.clear();
    }

    @Override
    public GatewayOrderResponse createOrder(Long orderId, BigDecimal amount, String currency, String receipt) {
        String gatewayOrderId = "order_test_" + UUID.randomUUID().toString().substring(0, 14);
        long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();
        orderAmounts.put(gatewayOrderId, amountInPaise);

        log.info("[TEST-MOCK] Created test gateway order: orderId={}, amountInPaise={}", gatewayOrderId, amountInPaise);

        return GatewayOrderResponse.builder()
                .gatewayOrderId(gatewayOrderId)
                .amountInPaise(amountInPaise)
                .currency(currency != null ? currency : "INR")
                .keyId(TEST_KEY_ID)
                .status("created")
                .receipt(receipt != null ? receipt : ("SHOPIVO-ORD-" + orderId))
                .build();
    }

    @Override
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        if (signature == null || signature.isBlank()) return false;
        if ("invalid_signature".equalsIgnoreCase(signature) || "bad_sig".equalsIgnoreCase(signature)) return false;

        try {
            String payload = orderId + "|" + paymentId;
            String expected = RazorpayPaymentGatewayService.calculateHmacSha256(payload, TEST_SECRET);
            return expected.equalsIgnoreCase(signature) || "valid_test_signature".equalsIgnoreCase(signature);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean verifyWebhookSignature(String requestBody, String signature) {
        if (signature == null || signature.isBlank()) return false;
        if ("invalid_webhook_sig".equalsIgnoreCase(signature)) return false;

        try {
            String expected = RazorpayPaymentGatewayService.calculateHmacSha256(requestBody, TEST_WEBHOOK_SECRET);
            return expected.equalsIgnoreCase(signature) || "valid_test_webhook_sig".equalsIgnoreCase(signature);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public GatewayPaymentDetails fetchPayment(String paymentId) {
        if (customPayments.containsKey(paymentId)) {
            return customPayments.get(paymentId);
        }

        // Deterministic mock scenarios by paymentId convention
        if ("pay_failed".equalsIgnoreCase(paymentId)) {
            return GatewayPaymentDetails.builder()
                    .paymentId(paymentId)
                    .currency("INR")
                    .status("failed")
                    .method("upi")
                    .errorDescription("Simulated gateway failure")
                    .build();
        }

        if ("pay_currency_mismatch".equalsIgnoreCase(paymentId)) {
            return GatewayPaymentDetails.builder()
                    .paymentId(paymentId)
                    .currency("USD")
                    .status("captured")
                    .method("card")
                    .build();
        }

        if ("pay_amount_mismatch".equalsIgnoreCase(paymentId)) {
            return GatewayPaymentDetails.builder()
                    .paymentId(paymentId)
                    .amountInPaise(9999999L)
                    .currency("INR")
                    .status("captured")
                    .method("card")
                    .build();
        }

        if ("pay_order_mismatch".equalsIgnoreCase(paymentId)) {
            return GatewayPaymentDetails.builder()
                    .paymentId(paymentId)
                    .orderId("order_completely_different")
                    .currency("INR")
                    .status("captured")
                    .method("card")
                    .build();
        }

        // Default successful payment
        return GatewayPaymentDetails.builder()
                .paymentId(paymentId)
                .currency("INR")
                .status("captured")
                .method("upi")
                .vpa("customer@upi")
                .cardLast4("4242")
                .build();
    }

    @Override
    public GatewayRefundResponse refundPayment(String paymentId, BigDecimal amount, String reason) {
        if ("pay_fail_refund".equalsIgnoreCase(paymentId)) {
            throw new RuntimeException("Simulated gateway refund failure");
        }

        String refundId = "rfnd_test_" + UUID.randomUUID().toString().substring(0, 14);
        long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();

        return GatewayRefundResponse.builder()
                .refundId(refundId)
                .paymentId(paymentId)
                .amountInPaise(amountInPaise)
                .currency("INR")
                .status("processed")
                .build();
    }

    @Override
    public String getPublicKeyId() {
        return TEST_KEY_ID;
    }
}
