package com.securecommerce.platform.payment.service;

import com.securecommerce.platform.payment.dto.CreateGatewayOrderRequest;
import com.securecommerce.platform.payment.dto.GatewayOrderDto;
import com.securecommerce.platform.payment.dto.PaymentResponse;
import com.securecommerce.platform.payment.dto.ProcessCodPaymentRequest;
import com.securecommerce.platform.payment.dto.ProcessPaymentRequest;
import com.securecommerce.platform.payment.dto.QrPaymentDto;
import com.securecommerce.platform.payment.dto.VerifyPaymentRequest;
import com.securecommerce.platform.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PaymentService {

    /**
     * Creates an online gateway order with Razorpay.
     * Idempotent: reuses active initiated gateway order if present.
     */
    GatewayOrderDto createGatewayOrder(Long customerId, CreateGatewayOrderRequest request);

    /**
     * Verifies payment via HMAC signature & authoritative Razorpay payment details.
     */
    PaymentResponse verifyGatewayPayment(Long customerId, VerifyPaymentRequest request);

    /**
     * Confirms a Cash on Delivery order.
     */
    PaymentResponse processCodPayment(Long customerId, ProcessCodPaymentRequest request);

    /**
     * Ingests, authenticates, and idempotently processes a Razorpay webhook event.
     */
    void processWebhook(String rawPayload, String signatureHeader, String eventIdHeader);

    /**
     * Legacy simulated customer payment processing - DECOMMISSIONED.
     */
    PaymentResponse processPayment(Long customerId, ProcessPaymentRequest request);

    /**
     * Retrieves all payment history for a customer.
     */
    List<PaymentResponse> getCustomerPayments(Long customerId);

    /**
     * Retrieves payment by order ID with role authorization.
     */
    PaymentResponse getPaymentByOrderId(Long orderId, User requester);

    /**
     * Admin view of all payments with pagination.
     */
    Page<PaymentResponse> getAllPaymentsForAdmin(Pageable pageable);

    /**
     * Generates a dynamic Razorpay UPI QR code for the customer's order.
     * Falls back cleanly to Standard Checkout metadata if standalone QR API is inactive.
     */
    QrPaymentDto createQrPayment(Long customerId, Long orderId);

    /**
     * Cancels an active dynamic QR payment session and closes the gateway QR code.
     */
    boolean cancelQrPayment(Long customerId, Long orderId);
}
