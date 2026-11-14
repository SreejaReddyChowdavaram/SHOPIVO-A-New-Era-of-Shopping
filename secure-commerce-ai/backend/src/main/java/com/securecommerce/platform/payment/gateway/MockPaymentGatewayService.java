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
    private final Map<String, GatewayQrCodeResponse> customQrCodes = new ConcurrentHashMap<>();
    private final Map<String, GatewayRefundResponse> customRefunds = new ConcurrentHashMap<>();
    private final Map<String, GatewayRefundResponse> refundsByReceipt = new ConcurrentHashMap<>();
    private boolean forceQrFallback = false;
    private int refundCallCount = 0;

    public void setForceQrFallback(boolean forceQrFallback) {
        this.forceQrFallback = forceQrFallback;
    }

    public int getRefundCallCount() {
        return refundCallCount;
    }

    public void resetRefundCallCount() {
        this.refundCallCount = 0;
    }

    public void registerRefundDetails(String refundId, GatewayRefundResponse details) {
        customRefunds.put(refundId, details);
    }

    public void registerPaymentDetails(String paymentId, GatewayPaymentDetails details) {
        customPayments.put(paymentId, details);
    }

    public void clearMockData() {
        customPayments.clear();
        orderAmounts.clear();
        customQrCodes.clear();
        customRefunds.clear();
        refundsByReceipt.clear();
        forceQrFallback = false;
        refundCallCount = 0;
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
    public GatewayPaymentDetails capturePayment(String paymentId, Long amountInPaise, String currency) {
        log.info("[TEST-MOCK] Captured payment {}: amount={} paise, currency={}", paymentId, amountInPaise, currency);
        return GatewayPaymentDetails.builder()
                .paymentId(paymentId)
                .amountInPaise(amountInPaise)
                .currency(currency != null ? currency : "INR")
                .status("captured")
                .method("card")
                .build();
    }

    @Override
    public GatewayRefundResponse refundPayment(String paymentId, BigDecimal amount, String reason) {
        return refundPayment(paymentId, amount, reason, null);
    }

    @Override
    public GatewayRefundResponse refundPayment(String paymentId, BigDecimal amount, String reason, String receipt) {
        refundCallCount++;

        if ("pay_fail_refund".equalsIgnoreCase(paymentId)) {
            throw new RuntimeException("Simulated gateway refund failure");
        }

        if ("pay_timeout_refund".equalsIgnoreCase(paymentId)) {
            throw new RuntimeException("Simulated gateway connection timeout during refund submission");
        }

        if (receipt != null && refundsByReceipt.containsKey(receipt)) {
            log.info("[TEST-MOCK] Returning existing refund by receipt: {}", receipt);
            return refundsByReceipt.get(receipt);
        }

        String refundId = "rfnd_test_" + UUID.randomUUID().toString().substring(0, 14);
        long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();
        String status = "pay_processing_refund".equalsIgnoreCase(paymentId) ? "processing" : "processed";

        GatewayRefundResponse resp = GatewayRefundResponse.builder()
                .refundId(refundId)
                .paymentId(paymentId)
                .amountInPaise(amountInPaise)
                .currency("INR")
                .status(status)
                .build();

        customRefunds.put(refundId, resp);
        if (receipt != null) {
            refundsByReceipt.put(receipt, resp);
        }

        return resp;
    }

    @Override
    public GatewayRefundResponse fetchRefund(String refundId) {
        if (customRefunds.containsKey(refundId)) {
            return customRefunds.get(refundId);
        }

        if (refundId != null && (refundId.startsWith("rfnd_timeout_") || refundId.startsWith("rfnd_pending_"))) {
            return GatewayRefundResponse.builder()
                    .refundId(refundId)
                    .amountInPaise(10000L)
                    .currency("INR")
                    .status("processing")
                    .build();
        }

        return GatewayRefundResponse.builder()
                .refundId(refundId)
                .amountInPaise(10000L)
                .currency("INR")
                .status("processed")
                .build();
    }

    @Override
    public GatewayQrCodeResponse createQrCode(Long orderId, BigDecimal amount, String currency, String description, Long closeByEpochSeconds) {
        if (forceQrFallback || (orderId != null && orderId == 8888L)) {
            return GatewayQrCodeResponse.builder()
                    .fallbackMode("STANDARD_CHECKOUT_FALLBACK")
                    .fallbackReason("Simulated QR API unavailable for merchant")
                    .amountInPaise(amount.multiply(BigDecimal.valueOf(100)).longValue())
                    .currency(currency != null ? currency : "INR")
                    .build();
        }

        long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();
        String qrId = "qr_test_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        String imageUrl = "https://api.razorpay.com/v1/payments/qr_codes/" + qrId + "/image";
        long closeBy = closeByEpochSeconds != null ? closeByEpochSeconds : (System.currentTimeMillis() / 1000 + 600);

        GatewayQrCodeResponse response = GatewayQrCodeResponse.builder()
                .qrCodeId(qrId)
                .imageUrl(imageUrl)
                .amountInPaise(amountInPaise)
                .currency(currency != null ? currency : "INR")
                .status("active")
                .closeBy(closeBy)
                .build();

        customQrCodes.put(qrId, response);
        return response;
    }

    @Override
    public boolean closeQrCode(String qrCodeId) {
        if (qrCodeId == null) return false;
        customQrCodes.remove(qrCodeId);
        return true;
    }

    @Override
    public String getPublicKeyId() {
        return TEST_KEY_ID;
    }
}
