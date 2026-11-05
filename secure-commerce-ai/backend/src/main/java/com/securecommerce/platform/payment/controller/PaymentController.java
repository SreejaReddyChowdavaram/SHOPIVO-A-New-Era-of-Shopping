package com.securecommerce.platform.payment.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.payment.dto.*;
import com.securecommerce.platform.payment.service.PaymentService;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * PaymentController — Customer & Webhook Payment Endpoints.
 *
 * POST /api/payments/create-gateway-order  → Initiate Razorpay online payment
 * POST /api/payments/verify-gateway-payment → Authoritatively verify & capture payment
 * POST /api/payments/cod                   → Place Cash on Delivery order
 * POST /api/payments/webhook/razorpay      → Ingest Razorpay asynchronous webhooks
 * POST /api/payments/process               → Legacy simulation endpoint (DECOMMISSIONED, 410 GONE)
 * GET  /api/payments/mine                  → Customer payment history
 * GET  /api/payments/order/{id}            → Payment details for specific order
 */
@Slf4j
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Customer initiates an online payment session with Razorpay.
     */
    @PostMapping("/create-gateway-order")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<GatewayOrderDto>> createGatewayOrder(
            @Valid @RequestBody CreateGatewayOrderRequest request,
            @AuthenticationPrincipal User currentUser) {
        GatewayOrderDto response = paymentService.createGatewayOrder(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gateway order created", response));
    }

    /**
     * Customer submits payment verification tokens from Razorpay Standard Checkout.
     */
    @PostMapping("/verify-gateway-payment")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyGatewayPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            @AuthenticationPrincipal User currentUser) {
        PaymentResponse response = paymentService.verifyGatewayPayment(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", response));
    }

    /**
     * Customer confirms a Cash on Delivery (COD) payment.
     */
    @PostMapping("/cod")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> processCodPayment(
            @Valid @RequestBody ProcessCodPaymentRequest request,
            @AuthenticationPrincipal User currentUser) {
        PaymentResponse response = paymentService.processCodPayment(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("COD payment confirmed", response));
    }

    /**
     * Razorpay asynchronous server-to-server webhook endpoint.
     * Publicly accessible, secured via HMAC-SHA256 signature verification.
     */
    @PostMapping("/webhook/razorpay")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId) {
        paymentService.processWebhook(rawPayload, signature, eventId);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    /**
     * Legacy simulated customer payment processing - DECOMMISSIONED.
     */
    @PostMapping("/process")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(
            @Valid @RequestBody ProcessPaymentRequest request,
            @AuthenticationPrincipal User currentUser) {
        paymentService.processPayment(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.GONE).build();
    }

    /**
     * Customer views their own payment transaction logs.
     */
    @GetMapping("/mine")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments(
            @AuthenticationPrincipal User currentUser) {
        List<PaymentResponse> payments = paymentService.getCustomerPayments(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved", payments));
    }

    /**
     * View payment details for a specific order.
     */
    @GetMapping("/order/{orderId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByOrderId(
            @PathVariable Long orderId,
            @AuthenticationPrincipal User currentUser) {
        PaymentResponse payment = paymentService.getPaymentByOrderId(orderId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved", payment));
    }
}
