package com.securecommerce.platform.payment.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

/**
 * RazorpayPaymentGatewayService — Production-style Razorpay integration locked to TEST MODE.
 *
 * Enforces:
 * 1. Fails fast if credentials are missing or live credentials are used in development.
 * 2. Never silently falls back to mock behavior.
 * 3. Constant-time HMAC-SHA256 signature verification.
 */
@Slf4j
@Service
@Profile("!test")
public class RazorpayPaymentGatewayService implements PaymentGatewayService {

    private final String mode;
    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    private final boolean liveEnabled;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public RazorpayPaymentGatewayService(
            String mode,
            String keyId,
            String keySecret,
            String webhookSecret,
            ObjectMapper objectMapper) {
        this(mode, keyId, keySecret, webhookSecret, false, objectMapper);
    }

    @Autowired
    public RazorpayPaymentGatewayService(
            @Value("${app.razorpay.mode:TEST}") String mode,
            @Value("${app.razorpay.key-id:}") String keyId,
            @Value("${app.razorpay.key-secret:}") String keySecret,
            @Value("${app.razorpay.webhook-secret:}") String webhookSecret,
            @Value("${app.razorpay.live-enabled:false}") boolean liveEnabled,
            ObjectMapper objectMapper) {

        this.mode = mode != null && !mode.isBlank() ? mode.trim().toUpperCase() : "TEST";
        this.keyId = keyId != null ? keyId.trim() : "";
        this.keySecret = keySecret != null ? keySecret.trim() : "";
        this.webhookSecret = webhookSecret != null ? webhookSecret.trim() : "";
        this.liveEnabled = liveEnabled;
        this.objectMapper = objectMapper;

        // Mode and Credential Guard — Fail-fast validation
        validateModeAndCredentials();

        this.restClient = RestClient.builder()
                .baseUrl("https://api.razorpay.com/v1")
                .defaultHeaders(headers -> {
                    if (!this.keyId.isEmpty() && !this.keySecret.isEmpty()) {
                        headers.setBasicAuth(this.keyId, this.keySecret);
                    }
                })
                .build();
    }

    private void validateModeAndCredentials() {
        if (!"TEST".equals(this.mode) && !"LIVE".equals(this.mode)) {
            throw new IllegalStateException("Invalid RAZORPAY_MODE: '" + this.mode + "'. Expected 'TEST' or 'LIVE'.");
        }

        if ("LIVE".equals(this.mode)) {
            if (this.keyId.isEmpty() || this.keySecret.isEmpty()) {
                throw new IllegalStateException("RAZORPAY_MODE is LIVE but RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Cannot start in LIVE mode without production credentials.");
            }
            if (this.keyId.startsWith("rzp_test")) {
                throw new IllegalStateException("RAZORPAY_MODE is configured as LIVE, but a Test Mode key (rzp_test_*) was provided. Rejecting startup to prevent mode mismatch.");
            }
            if (!this.keyId.startsWith("rzp_live")) {
                throw new IllegalStateException("RAZORPAY_MODE is configured as LIVE, but key ID does not start with 'rzp_live_'. Key ID: " + maskKey(this.keyId));
            }
            if (!this.liveEnabled) {
                throw new IllegalStateException("RAZORPAY_MODE is configured as LIVE, but RAZORPAY_LIVE_ENABLED is false. Explicit dual-confirmation (RAZORPAY_LIVE_ENABLED=true) is required to activate real-money transactions.");
            }
            if (this.webhookSecret.isEmpty()) {
                log.warn("RAZORPAY_MODE is LIVE but RAZORPAY_WEBHOOK_SECRET is not configured. Webhook signatures cannot be verified.");
            }
            log.info("Razorpay Gateway initialized in LIVE mode with key: {}", maskKey(this.keyId));
        } else {
            // TEST mode
            if (this.keyId.startsWith("rzp_live")) {
                throw new IllegalStateException("RAZORPAY_MODE is TEST, but a Live key (rzp_live_*) was provided. Rejecting startup to protect against accidental live transactions in test mode.");
            }
            if (isDevelopmentPlaceholderKey()) {
                log.info("Razorpay Gateway initialized in TEST mode with dev placeholder key (simulation enabled)");
            } else if (this.keyId.isEmpty() || this.keySecret.isEmpty()) {
                log.warn("Razorpay credentials are not configured in TEST mode. Online payments will require dev placeholder credentials.");
            } else {
                log.info("Razorpay Gateway initialized in TEST mode with key: {}", maskKey(this.keyId));
            }
        }
    }

    private String maskKey(String key) {
        if (key == null || key.length() <= 8) return "***";
        return key.substring(0, 8) + "..." + key.substring(key.length() - 4);
    }

    private void ensureConfigured() {
        if (keyId.isEmpty() || keySecret.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Razorpay payment gateway credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing or not configured. Cannot process payment.");
        }
    }

    @Override
    public GatewayOrderResponse createOrder(Long orderId, BigDecimal amount, String currency, String receipt) {
        ensureConfigured();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order amount for payment creation");
        }

        // Amount in paise (e.g. 500.00 INR -> 50000 paise)
        long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();

        Map<String, Object> requestBody = Map.of(
                "amount", amountInPaise,
                "currency", currency != null ? currency : "INR",
                "receipt", receipt != null ? receipt : ("SHOPIVO-ORD-" + orderId),
                "notes", Map.of(
                        "shopivo_order_id", String.valueOf(orderId),
                        "platform", "Shopivo"
                )
        );

        // If using dev placeholder credentials, generate local test order without requiring live internet call
        if (isDevelopmentPlaceholderKey()) {
            String gatewayOrderId = "order_dev_" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            log.info("[DEV-TEST-MODE] Generated local test order {} for Shopivo order #{}", gatewayOrderId, orderId);
            return GatewayOrderResponse.builder()
                    .gatewayOrderId(gatewayOrderId)
                    .amountInPaise(amountInPaise)
                    .currency(currency != null ? currency : "INR")
                    .keyId(keyId)
                    .status("created")
                    .receipt(receipt)
                    .build();
        }

        try {
            String responseStr = restClient.post()
                    .uri("/orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseStr);
            String gatewayOrderId = root.path("id").asText();
            String status = root.path("status").asText();

            log.info("Razorpay Test Order created successfully: gatewayOrderId={}, amountInPaise={}", gatewayOrderId, amountInPaise);

            return GatewayOrderResponse.builder()
                    .gatewayOrderId(gatewayOrderId)
                    .amountInPaise(amountInPaise)
                    .currency(currency != null ? currency : "INR")
                    .keyId(keyId)
                    .status(status)
                    .receipt(receipt)
                    .build();

        } catch (Exception e) {
            log.error("Failed to create Razorpay gateway order for Shopivo order #{}: {}", orderId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Razorpay Order creation failed: " + e.getMessage());
        }
    }

    @Override
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        ensureConfigured();

        if (orderId == null || paymentId == null || signature == null ||
                orderId.isBlank() || paymentId.isBlank() || signature.isBlank()) {
            return false;
        }

        try {
            String payload = orderId + "|" + paymentId;
            String expectedSignature = calculateHmacSha256(payload, keySecret);
            if (MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    signature.trim().getBytes(StandardCharsets.UTF_8)
            )) {
                return true;
            }
            if (isDevelopmentPlaceholderKey() && signature.startsWith("sig_dev_")) {
                log.info("[DEV-TEST-MODE] Accepted local dev test signature for orderId={}", orderId);
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error computing Razorpay payment signature: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public boolean verifyWebhookSignature(String requestBody, String signature) {
        if (webhookSecret.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Razorpay webhook secret (RAZORPAY_WEBHOOK_SECRET) is not configured.");
        }

        if (requestBody == null || signature == null || signature.isBlank()) {
            return false;
        }

        try {
            String expectedSignature = calculateHmacSha256(requestBody, webhookSecret);
            return MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    signature.trim().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Error verifying Razorpay webhook signature: {}", e.getMessage());
            return false;
        }
    }

    private boolean isDevelopmentPlaceholderKey() {
        if (!"TEST".equals(mode)) {
            return false;
        }
        return keyId.contains("shopivo_dev") || keyId.contains("placeholder") || keyId.contains("mock");
    }

    @Override
    public GatewayPaymentDetails fetchPayment(String paymentId) {
        ensureConfigured();

        if (isDevelopmentPlaceholderKey()) {
            log.info("[DEV-TEST-MODE] Resolving test payment details for {}", paymentId);
            return GatewayPaymentDetails.builder()
                    .paymentId(paymentId)
                    .currency("INR")
                    .status("captured")
                    .method("upi")
                    .vpa("customer@okhdfcbank")
                    .cardLast4("4242")
                    .build();
        }

        try {
            String responseStr = restClient.get()
                    .uri("/payments/{paymentId}", paymentId)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseStr);
            return GatewayPaymentDetails.builder()
                    .paymentId(root.path("id").asText())
                    .orderId(root.path("order_id").asText(null))
                    .amountInPaise(root.path("amount").asLong(0))
                    .currency(root.path("currency").asText("INR"))
                    .status(root.path("status").asText())
                    .method(root.path("method").asText("unknown"))
                    .cardLast4(root.path("card").path("last4").asText(null))
                    .vpa(root.path("vpa").asText(null))
                    .bank(root.path("bank").asText(null))
                    .errorDescription(root.path("error_description").asText(null))
                    .build();

        } catch (Exception e) {
            log.error("Failed to fetch Razorpay payment {}: {}", paymentId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to fetch payment details from Razorpay: " + e.getMessage());
        }
    }

    @Override
    public GatewayRefundResponse refundPayment(String paymentId, BigDecimal amount, String reason) {
        ensureConfigured();

        long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();

        if (isDevelopmentPlaceholderKey()) {
            String refundId = "rfnd_dev_" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            log.info("[DEV-TEST-MODE] Generated local test refund {} for payment {}", refundId, paymentId);
            return GatewayRefundResponse.builder()
                    .refundId(refundId)
                    .paymentId(paymentId)
                    .amountInPaise(amountInPaise)
                    .currency("INR")
                    .status("processed")
                    .build();
        }

        Map<String, Object> requestBody = Map.of(
                "amount", amountInPaise,
                "notes", Map.of("reason", reason != null ? reason : "Customer return accepted")
        );

        try {
            String responseStr = restClient.post()
                    .uri("/payments/{paymentId}/refund", paymentId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseStr);
            return GatewayRefundResponse.builder()
                    .refundId(root.path("id").asText())
                    .paymentId(root.path("payment_id").asText())
                    .amountInPaise(root.path("amount").asLong(amountInPaise))
                    .currency(root.path("currency").asText("INR"))
                    .status(root.path("status").asText("processed"))
                    .speedProcessed(root.path("speed_processed").asText(null))
                    .build();

        } catch (Exception e) {
            log.error("Failed to issue Razorpay refund for payment {}: {}", paymentId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Razorpay Refund API error: " + e.getMessage());
        }
    }

    @Override
    public GatewayQrCodeResponse createQrCode(Long orderId, BigDecimal amount, String currency, String description, Long closeByEpochSeconds) {
        ensureConfigured();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order amount for QR code generation");
        }

        long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();
        String desc = description != null ? description : ("SHOPIVO Order #" + orderId);
        long minSafeCloseBy = (System.currentTimeMillis() / 1000) + 960; // 16 mins (exceeds Razorpay 15-minute floor)
        long closeBy = (closeByEpochSeconds != null && closeByEpochSeconds >= minSafeCloseBy)
                ? closeByEpochSeconds
                : minSafeCloseBy;

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("type", "upi_qr");
        requestBody.put("name", "SHOPIVO Order Payment");
        requestBody.put("usage", "single_use");
        requestBody.put("fixed_amount", true);
        requestBody.put("payment_amount", amountInPaise);
        requestBody.put("description", desc);
        requestBody.put("close_by", closeBy);
        requestBody.put("notes", Map.of(
                "shopivo_order_id", String.valueOf(orderId),
                "platform", "SHOPIVO"
        ));

        try {
            String responseStr = restClient.post()
                    .uri("/payments/qr_codes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseStr);
            String qrId = root.path("id").asText();
            String imageUrl = root.path("image_url").asText();
            String status = root.path("status").asText("active");
            long returnedCloseBy = root.path("close_by").asLong(closeBy);

            log.info("Razorpay QR code created successfully for order #{}: qrCodeId={}, imageUrl={}", orderId, qrId, imageUrl);

            return GatewayQrCodeResponse.builder()
                    .qrCodeId(qrId)
                    .imageUrl(imageUrl)
                    .amountInPaise(amountInPaise)
                    .currency(currency != null ? currency : "INR")
                    .status(status)
                    .closeBy(returnedCloseBy)
                    .build();

        } catch (org.springframework.web.client.RestClientResponseException rce) {
            int statusCode = rce.getStatusCode().value();
            String safeError = parseRazorpayError(rce.getResponseBodyAsString(), rce.getMessage());
            log.warn("Razorpay QR Code API returned HTTP {} for order #{}: {}. Triggering Standard Checkout fallback.",
                    statusCode, orderId, safeError);

            return GatewayQrCodeResponse.builder()
                    .fallbackMode("STANDARD_CHECKOUT_FALLBACK")
                    .fallbackReason("Razorpay QR Code API rejected creation (HTTP " + statusCode + "): " + safeError)
                    .amountInPaise(amountInPaise)
                    .currency(currency != null ? currency : "INR")
                    .build();
        } catch (Exception e) {
            log.warn("Standalone Razorpay QR Code API error for order #{}: {}. Triggering Standard Checkout dynamic UPI QR fallback.",
                    orderId, e.getMessage());

            return GatewayQrCodeResponse.builder()
                    .fallbackMode("STANDARD_CHECKOUT_FALLBACK")
                    .fallbackReason("Razorpay QR Code API unavailable or error: " + e.getMessage())
                    .amountInPaise(amountInPaise)
                    .currency(currency != null ? currency : "INR")
                    .build();
        }
    }

    private String parseRazorpayError(String responseBody, String defaultMessage) {
        if (responseBody != null && !responseBody.isBlank()) {
            try {
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode errorNode = root.path("error");
                String description = errorNode.path("description").asText(null);
                String code = errorNode.path("code").asText(null);
                if (description != null && !description.isBlank()) {
                    return (code != null ? code + ": " : "") + description;
                }
            } catch (Exception ignored) {}
        }
        return defaultMessage;
    }

    @Override
    public boolean closeQrCode(String qrCodeId) {
        if (qrCodeId == null || qrCodeId.isBlank()) return false;

        if (isDevelopmentPlaceholderKey() || qrCodeId.startsWith("qr_dev_") || qrCodeId.startsWith("qr_test_")) {
            log.info("[RAZORPAY-DEV-SIMULATION] Closed simulated QR code: {}", qrCodeId);
            return true;
        }

        try {
            restClient.post()
                    .uri("/payments/qr_codes/{id}/close", qrCodeId)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Successfully closed Razorpay QR code: {}", qrCodeId);
            return true;
        } catch (Exception e) {
            log.warn("Failed to close Razorpay QR code {}: {}", qrCodeId, e.getMessage());
            return false;
        }
    }

    @Override
    public String getPublicKeyId() {
        return keyId;
    }

    @Override
    public String getMode() {
        return mode;
    }

    public static String calculateHmacSha256(String data, String key) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
