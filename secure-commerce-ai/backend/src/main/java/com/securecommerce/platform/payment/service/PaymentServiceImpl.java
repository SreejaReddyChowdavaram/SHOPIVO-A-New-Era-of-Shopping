package com.securecommerce.platform.payment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.service.EventLoggingService;
import com.securecommerce.platform.notification.entity.NotificationType;
import com.securecommerce.platform.notification.service.NotificationService;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.payment.dto.*;
import com.securecommerce.platform.payment.entity.*;
import com.securecommerce.platform.payment.gateway.GatewayOrderResponse;
import com.securecommerce.platform.payment.gateway.GatewayPaymentDetails;
import com.securecommerce.platform.payment.gateway.GatewayQrCodeResponse;
import com.securecommerce.platform.payment.gateway.PaymentGatewayService;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.payment.repository.PaymentWebhookEventRepository;
import com.securecommerce.platform.returns.entity.Refund;
import com.securecommerce.platform.returns.entity.RefundStatus;
import com.securecommerce.platform.returns.repository.RefundRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * PaymentServiceImpl — Production-grade Razorpay payment implementation (Test Mode).
 *
 * Enforces:
 * 1. Old customer simulation endpoint is completely decommissioned (410 GONE).
 * 2. Idempotent gateway order creation (multiple clicks reuse active initiated order).
 * 3. Authoritative server-side verification (HMAC signature + provider status + amount + INR currency).
 * 4. Raw signatures, CVVs, and credentials are NEVER persisted or exposed.
 * 5. Webhook event-level deduplication via X-Razorpay-Event-Id header.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentWebhookEventRepository paymentWebhookEventRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PaymentGatewayService paymentGatewayService;
    private final ObjectMapper objectMapper;
    private final EventLoggingService eventLoggingService;
    private final RefundRepository refundRepository;

    @Value("${app.razorpay.key-id:}")
    private String razorpayKeyId;

    @Override
    public GatewayOrderDto createGatewayOrder(Long customerId, CreateGatewayOrderRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        // 1. Authorization: Only the ordering customer can initiate payment
        if (!order.getCustomer().getId().equals(customerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to pay for this order");
        }

        // 2. Order status validations
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot pay for a cancelled order");
        }

        // 3. Check payment expiry window
        if (order.getPaymentExpiresAt() != null && order.getPaymentExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment window for this order has expired. Please place a new order.");
        }

        // 4. Prevent duplicate payment for already successful orders
        if (paymentRepository.existsByOrderIdAndPaymentStatus(order.getId(), PaymentStatus.SUCCESS)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This order has already been paid successfully");
        }

        long amountInPaise = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        String orderRef = order.getOrderReference() != null ? order.getOrderReference() : ("SHV-" + order.getId());

        // 5. IDEMPOTENCY: Check if an active INITIATED gateway payment already exists for this order
        Optional<Payment> activePaymentOpt = paymentRepository.findFirstByOrderIdAndProviderOrderByCreatedAtDesc(order.getId(), "RAZORPAY");
        if (activePaymentOpt.isPresent()) {
            Payment activePayment = activePaymentOpt.get();
            if (activePayment.getPaymentStatus() == PaymentStatus.INITIATED && activePayment.getProviderOrderId() != null) {
                log.info("Idempotent hit: Reusing active gateway order {} for Shopivo order {}",
                        activePayment.getProviderOrderId(), orderRef);
                return new GatewayOrderDto(
                        order.getId(),
                        orderRef,
                        activePayment.getProviderOrderId(),
                        order.getTotalAmount(),
                        amountInPaise,
                        "INR",
                        razorpayKeyId,
                        customer.getFirstName() + (customer.getLastName() != null ? " " + customer.getLastName() : ""),
                        customer.getEmail(),
                        order.getShippingPhone()
                );
            }
        }

        // 6. Create new Gateway Order with Razorpay
        GatewayOrderResponse gwOrder = paymentGatewayService.createOrder(
                order.getId(),
                order.getTotalAmount(),
                "INR",
                "rcpt_ord_" + order.getId() + "_" + System.currentTimeMillis()
        );

        // 7. Persist payment record in INITIATED state
        Payment payment = Payment.builder()
                .order(order)
                .customer(customer)
                .provider("RAZORPAY")
                .paymentMethod(PaymentMethod.RAZORPAY)
                .paymentStatus(PaymentStatus.INITIATED)
                .providerOrderId(gwOrder.gatewayOrderId())
                .amount(order.getTotalAmount())
                .transactionId("ORD-" + gwOrder.gatewayOrderId())
                .providerSignatureVerified(false)
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        eventLoggingService.logEvent(
                EventType.PAYMENT_ATTEMPTED,
                customerId,
                "ORDER",
                String.valueOf(order.getId()),
                Map.of(
                        "provider", "RAZORPAY",
                        "amount", order.getTotalAmount(),
                        "gatewayOrderId", gwOrder.gatewayOrderId()
                )
        );

        log.info("Created new gateway order {} for Shopivo order {} (amount={} paise)",
                gwOrder.gatewayOrderId(), orderRef, amountInPaise);

        return new GatewayOrderDto(
                order.getId(),
                orderRef,
                gwOrder.gatewayOrderId(),
                order.getTotalAmount(),
                amountInPaise,
                "INR",
                razorpayKeyId,
                customer.getFirstName() + (customer.getLastName() != null ? " " + customer.getLastName() : ""),
                customer.getEmail(),
                order.getShippingPhone()
        );
    }

    @Override
    public PaymentResponse verifyGatewayPayment(Long customerId, VerifyPaymentRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to verify this payment");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot verify payment for a cancelled order");
        }

        // Authoritative backend payment session expiry validation
        if (order.getStatus() == OrderStatus.PENDING && order.getPaymentExpiresAt() != null && order.getPaymentExpiresAt().isBefore(Instant.now())) {
            Optional<Payment> initiatedPayment = paymentRepository.findByProviderOrderId(request.razorpayOrderId());
            initiatedPayment.ifPresent(p -> {
                if (p.getPaymentStatus() == PaymentStatus.INITIATED) {
                    p.setPaymentStatus(PaymentStatus.FAILED);
                    p.setFailureReason("Payment session expired. Please generate a new payment QR code.");
                    paymentRepository.save(p);
                }
            });
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment session expired. Please generate a new payment QR code.");
        }

        // Check if already paid with same payment ID (idempotent retry)
        Optional<Payment> existingSuccessOpt = paymentRepository.findByOrderId(order.getId());
        if (existingSuccessOpt.isPresent() && existingSuccessOpt.get().getPaymentStatus() == PaymentStatus.SUCCESS) {
            Payment p = existingSuccessOpt.get();
            if (request.razorpayPaymentId().equals(p.getProviderPaymentId())) {
                log.info("Idempotent verify hit for order #{} and paymentId {}", order.getId(), request.razorpayPaymentId());
                return PaymentResponse.from(p);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order has already been paid with a different payment ID");
            }
        }

        // 1. Validate Cryptographic HMAC Signature
        boolean signatureValid = paymentGatewayService.verifyPaymentSignature(
                request.razorpayOrderId(),
                request.razorpayPaymentId(),
                request.razorpaySignature()
        );

        if (!signatureValid) {
            log.warn("CRITICAL: Payment signature verification failed for order #{}, razorpayOrderId={}",
                    order.getId(), request.razorpayOrderId());

            // Record failed attempt
            Optional<Payment> initiatedPayment = paymentRepository.findByProviderOrderId(request.razorpayOrderId());
            initiatedPayment.ifPresent(p -> {
                p.setPaymentStatus(PaymentStatus.FAILED);
                p.setFailureReason("Invalid HMAC-SHA256 signature");
                p.setProviderSignatureVerified(false);
                paymentRepository.save(p);
            });

            eventLoggingService.logEvent(
                    EventType.PAYMENT_FAILURE,
                    customerId,
                    "ORDER",
                    String.valueOf(order.getId()),
                    Map.of(
                            "provider", "RAZORPAY",
                            "amount", order.getTotalAmount(),
                            "failureCategory", "SIGNATURE_VERIFICATION_FAILED"
                    )
            );

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment signature verification failed");
        }

        // 2. Fetch authoritative payment status directly from Gateway API
        GatewayPaymentDetails details = paymentGatewayService.fetchPayment(request.razorpayPaymentId());

        // 3. Validate provider order ID match
        if (details.orderId() != null && !details.orderId().isBlank()) {
            if (!details.orderId().equals(request.razorpayOrderId())) {
                log.error("Provider order ID mismatch: expected {} but gateway reported {}",
                        request.razorpayOrderId(), details.orderId());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provider order ID mismatch");
            }
        }

        // 4. Validate authoritative amount
        long expectedPaise = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        if (details.amountInPaise() != null && !details.amountInPaise().equals(expectedPaise)) {
            log.error("Payment amount mismatch for order #{}: expected {} paise, gateway reported {} paise",
                    order.getId(), expectedPaise, details.amountInPaise());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount mismatch with order");
        }

        // 5. Validate currency
        if (!"INR".equalsIgnoreCase(details.currency())) {
            log.error("Payment currency mismatch for order #{}: expected INR, got {}",
                    order.getId(), details.currency());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment currency must be INR");
        }

        // 6. Validate actual provider payment status (captured or authorized)
        String gwStatus = details.status() != null ? details.status().toLowerCase() : "";
        if ("authorized".equals(gwStatus)) {
            log.info("Payment {} is in authorized status; capturing {} paise for order #{}",
                    request.razorpayPaymentId(), expectedPaise, order.getId());
            try {
                details = paymentGatewayService.capturePayment(request.razorpayPaymentId(), expectedPaise, "INR");
                gwStatus = details.status() != null ? details.status().toLowerCase() : "";
            } catch (Exception captureEx) {
                log.warn("Direct capture call returned: {}", captureEx.getMessage());
            }
        }

        final String finalGwStatus = gwStatus;
        if (!"captured".equals(finalGwStatus) && !"authorized".equals(finalGwStatus)) {
            log.warn("Payment is not in captured/authorized status: status={}", finalGwStatus);
            Optional<Payment> initiatedPayment = paymentRepository.findByProviderOrderId(request.razorpayOrderId());
            initiatedPayment.ifPresent(p -> {
                p.setPaymentStatus(PaymentStatus.FAILED);
                p.setFailureReason("Payment not captured by gateway: " + finalGwStatus);
                paymentRepository.save(p);
            });

            eventLoggingService.logEvent(
                    EventType.PAYMENT_FAILURE,
                    customerId,
                    "ORDER",
                    String.valueOf(order.getId()),
                    Map.of(
                            "provider", "RAZORPAY",
                            "amount", order.getTotalAmount(),
                            "failureCategory", "GATEWAY_STATUS_NOT_CAPTURED"
                    )
            );

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment has not been captured by the gateway");
        }

        // 7. Find or create payment entity to mark SUCCESS
        Payment payment = paymentRepository.findByProviderOrderId(request.razorpayOrderId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .customer(customer)
                        .provider("RAZORPAY")
                        .paymentMethod(PaymentMethod.RAZORPAY)
                        .amount(order.getTotalAmount())
                        .providerOrderId(request.razorpayOrderId())
                        .build()
                );

        payment.setProviderPaymentId(request.razorpayPaymentId());
        payment.setProviderSignatureVerified(true);
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setGatewayMethod(details.method() != null ? details.method() : "unknown");
        payment.setCardLast4(details.cardLast4());
        payment.setUpiIdSnapshot(details.vpa());
        payment.setTransactionId("PAY-" + request.razorpayPaymentId());
        payment.setFailureReason(null);

        Payment savedPayment = paymentRepository.save(payment);

        eventLoggingService.logEvent(
                EventType.PAYMENT_SUCCESS,
                customerId,
                "ORDER",
                String.valueOf(order.getId()),
                Map.of(
                        "provider", "RAZORPAY",
                        "paymentId", savedPayment.getId(),
                        "gatewayMethod", savedPayment.getGatewayMethod() != null ? savedPayment.getGatewayMethod() : "unknown",
                        "amount", savedPayment.getAmount()
                )
        );

        // 8. Transition Order status to CONFIRMED
        if (order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
        }

        log.info("Payment verified and confirmed: paymentId={}, orderId={}, gatewayMethod={}, amount=₹{}",
                savedPayment.getId(), order.getId(), savedPayment.getGatewayMethod(), savedPayment.getAmount());

        // 9. Dispatch notifications
        try {
            notificationService.createNotification(
                    customer,
                    NotificationType.PAYMENT_SUCCESS,
                    "Payment Successful",
                    String.format("Payment of ₹%s received successfully for Order #%d via Razorpay.",
                            savedPayment.getAmount(), order.getId()),
                    "ORDER",
                    order.getId()
            );
            notificationService.createNotification(
                    customer,
                    NotificationType.ORDER_CONFIRMED,
                    "Order Confirmed",
                    String.format("Your order #%d has been confirmed and is being processed.", order.getId()),
                    "ORDER",
                    order.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to dispatch payment notifications: {}", e.getMessage());
        }

        return PaymentResponse.from(savedPayment);
    }

    @Override
    public PaymentResponse processCodPayment(Long customerId, ProcessCodPaymentRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized for this order");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot choose COD for a cancelled order");
        }

        if (paymentRepository.existsByOrderIdAndPaymentStatus(order.getId(), PaymentStatus.SUCCESS)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This order has already been paid online");
        }

        // Advance Order to CONFIRMED
        if (order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
        }

        // Create COD Payment record in INITIATED status
        Payment payment = Payment.builder()
                .order(order)
                .customer(customer)
                .provider("OFFLINE")
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.INITIATED)
                .amount(order.getTotalAmount())
                .transactionId("COD-" + order.getId() + "-" + System.currentTimeMillis())
                .providerSignatureVerified(false)
                .failureReason(null)
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        eventLoggingService.logEvent(
                EventType.PAYMENT_ATTEMPTED,
                customerId,
                "ORDER",
                String.valueOf(order.getId()),
                Map.of(
                        "provider", "OFFLINE",
                        "method", "COD",
                        "amount", order.getTotalAmount()
                )
        );

        log.info("COD payment initiated and order confirmed: paymentId={}, orderId={}, amount=₹{}",
                savedPayment.getId(), order.getId(), savedPayment.getAmount());

        try {
            notificationService.createNotification(
                    customer,
                    NotificationType.ORDER_CONFIRMED,
                    "Cash on Delivery Order Confirmed",
                    String.format("Your COD order #%d for ₹%s has been confirmed. Please keep exact cash ready upon delivery.",
                            order.getId(), savedPayment.getAmount()),
                    "ORDER",
                    order.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to dispatch COD confirmation notification: {}", e.getMessage());
        }

        return PaymentResponse.from(savedPayment);
    }

    @Override
    public void processWebhook(String rawPayload, String signatureHeader, String eventIdHeader) {
        // 1. Verify Webhook HMAC signature
        boolean signatureValid = paymentGatewayService.verifyWebhookSignature(rawPayload, signatureHeader);
        if (!signatureValid) {
            log.warn("Webhook signature validation failed!");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook signature");
        }

        try {
            JsonNode root = objectMapper.readTree(rawPayload);

            // 2. Identify Event ID (official Razorpay header X-Razorpay-Event-Id, falling back to payload id)
            String providerEventId = (eventIdHeader != null && !eventIdHeader.isBlank())
                    ? eventIdHeader.trim()
                    : root.path("id").asText(UUID.randomUUID().toString());

            String eventType = root.path("event").asText("");

            // 3. Deduplication check: Has this event already been processed?
            if (paymentWebhookEventRepository.existsByEventId(providerEventId)) {
                log.info("Webhook event {} already processed. Skipping duplicate.", providerEventId);
                return;
            }

            // Extract entity fields safely without logging secrets or PANs
            JsonNode paymentEntity = root.path("payload").path("payment").path("entity");
            String providerPaymentId = paymentEntity.path("id").asText(null);
            String providerOrderId = paymentEntity.path("order_id").asText(null);
            String gatewayMethod = paymentEntity.path("method").asText(null);

            // In order.paid events, order_id can also be found directly in payload.order.entity.id
            if (providerOrderId == null || providerOrderId.isBlank()) {
                providerOrderId = root.path("payload").path("order").path("entity").path("id").asText(null);
            }

            // Audit record stored internally
            PaymentWebhookEvent webhookEvent = PaymentWebhookEvent.builder()
                    .provider("RAZORPAY")
                    .eventId(providerEventId)
                    .eventType(eventType)
                    .payload(rawPayload)
                    .processingStatus("PROCESSED")
                    .processedAt(Instant.now())
                    .build();

            paymentWebhookEventRepository.save(webhookEvent);

            log.info("Processing webhook event: type={}, eventId={}, orderId={}, paymentId={}",
                    eventType, providerEventId, providerOrderId, providerPaymentId);

            // 4. Handle event lifecycle
            if (("payment.captured".equalsIgnoreCase(eventType) || "order.paid".equalsIgnoreCase(eventType)) && providerOrderId != null) {
                Optional<Payment> paymentOpt = paymentRepository.findByProviderOrderId(providerOrderId);
                paymentOpt.ifPresent(payment -> {
                    if (payment.getPaymentStatus() == PaymentStatus.INITIATED) {
                        payment.setPaymentStatus(PaymentStatus.SUCCESS);
                        if (providerPaymentId != null && !providerPaymentId.isBlank()) {
                            payment.setProviderPaymentId(providerPaymentId);
                        }
                        if (gatewayMethod != null && !gatewayMethod.isBlank()) {
                            payment.setGatewayMethod(gatewayMethod);
                        }
                        payment.setProviderSignatureVerified(true);
                        paymentRepository.save(payment);

                        Order order = payment.getOrder();
                        if (order.getStatus() == OrderStatus.PENDING) {
                            order.setStatus(OrderStatus.CONFIRMED);
                            orderRepository.save(order);
                        }
                        log.info("Webhook updated order #{} to CONFIRMED via {}", order.getId(), eventType);
                    }
                });
            } else if ("payment.failed".equalsIgnoreCase(eventType) && providerOrderId != null) {
                Optional<Payment> paymentOpt = paymentRepository.findByProviderOrderId(providerOrderId);
                paymentOpt.ifPresent(payment -> {
                    if (payment.getPaymentStatus() == PaymentStatus.INITIATED) {
                        payment.setPaymentStatus(PaymentStatus.FAILED);
                        payment.setFailureReason(paymentEntity.path("error_description").asText("Payment failed at gateway"));
                        paymentRepository.save(payment);
                        log.info("Webhook marked payment for order #{} as FAILED", payment.getOrder().getId());
                    }
                });
            } else if ("refund.created".equalsIgnoreCase(eventType)) {
                JsonNode refundEntity = root.path("payload").path("refund").path("entity");
                String refundPaymentId = refundEntity.path("payment_id").asText(null);
                String refundId = refundEntity.path("id").asText(null);

                if (refundPaymentId != null) {
                    Optional<Payment> paymentOpt = paymentRepository.findByProviderPaymentId(refundPaymentId);
                    paymentOpt.ifPresent(payment -> {
                        if (payment.getPaymentStatus().canTransitionTo(PaymentStatus.REFUND_PROCESSING)) {
                            payment.setPaymentStatus(PaymentStatus.REFUND_PROCESSING);
                            if (refundId != null) {
                                payment.setRefundProviderId(refundId);
                            }
                            paymentRepository.save(payment);
                            log.info("Webhook updated payment {} to REFUND_PROCESSING via refund.created", payment.getId());
                        }
                    });
                }
            } else if ("refund.processed".equalsIgnoreCase(eventType)) {
                JsonNode refundEntity = root.path("payload").path("refund").path("entity");
                String refundPaymentId = refundEntity.path("payment_id").asText(null);
                String refundId = refundEntity.path("id").asText(null);

                if (refundPaymentId != null) {
                    Optional<Payment> paymentOpt = paymentRepository.findByProviderPaymentId(refundPaymentId);
                    paymentOpt.ifPresent(payment -> {
                        if (payment.getPaymentStatus().canTransitionTo(PaymentStatus.REFUNDED)) {
                            payment.setPaymentStatus(PaymentStatus.REFUNDED);
                            if (refundId != null) {
                                payment.setRefundProviderId(refundId);
                            }
                            paymentRepository.save(payment);
                            log.info("Webhook updated payment {} to REFUNDED via refund.processed", payment.getId());
                        }
                    });
                }
            } else if ("refund.failed".equalsIgnoreCase(eventType)) {
                JsonNode refundEntity = root.path("payload").path("refund").path("entity");
                String refundPaymentId = refundEntity.path("payment_id").asText(null);
                String errorDescription = refundEntity.path("error_description").asText("Refund failed at gateway");

                if (refundPaymentId != null) {
                    Optional<Payment> paymentOpt = paymentRepository.findByProviderPaymentId(refundPaymentId);
                    paymentOpt.ifPresent(payment -> {
                        // The original payment was captured successfully; do NOT mark the payment as FAILED!
                        payment.setFailureReason("Refund failed at gateway: " + errorDescription);
                        // If it was in REFUND_PROCESSING, restore SUCCESS status because money was not refunded
                        if (payment.getPaymentStatus() == PaymentStatus.REFUND_PROCESSING) {
                            payment.setPaymentStatus(PaymentStatus.SUCCESS);
                        }
                        paymentRepository.save(payment);
                        log.warn("Webhook recorded refund failure for payment #{} without downgrading payment status: {}",
                                payment.getId(), errorDescription);

                        // If a corresponding Refund entity exists, update its status to REFUND_FAILED
                        if (payment.getOrder() != null) {
                            Optional<Refund> refundOpt = refundRepository.findByOrderId(payment.getOrder().getId());
                            refundOpt.ifPresent(refund -> {
                                refund.setRefundStatus(RefundStatus.REFUND_FAILED);
                                refundRepository.save(refund);
                                log.info("Updated Refund record #{} to REFUND_FAILED", refund.getId());
                            });
                        }
                    });
                }
            } else if ("payment.authorized".equalsIgnoreCase(eventType) && providerOrderId != null) {
                log.info("Payment authorized for orderId={}. Attempting authoritative capture if uncaptured.", providerOrderId);
                Optional<Payment> paymentOpt = paymentRepository.findByProviderOrderId(providerOrderId);
                paymentOpt.ifPresent(p -> {
                    if (p.getPaymentStatus() == PaymentStatus.INITIATED && providerPaymentId != null && !providerPaymentId.isBlank()) {
                        try {
                            long paise = p.getAmount().multiply(BigDecimal.valueOf(100)).longValue();
                            paymentGatewayService.capturePayment(providerPaymentId, paise, "INR");
                            log.info("Proactively captured payment {} for order #{}", providerPaymentId, p.getOrder().getId());
                        } catch (Exception ex) {
                            log.warn("Proactive webhook capture notice: {}", ex.getMessage());
                        }
                    }
                });
            } else if ("qr_code.credited".equalsIgnoreCase(eventType)) {
                JsonNode qrEntity = root.path("payload").path("qr_code").path("entity");
                String qrId = qrEntity.path("id").asText(null);
                long qrCreditedAmount = paymentEntity.path("amount").asLong(0L);
                String upiVpa = paymentEntity.path("vpa").asText(null);

                // Find payment record by providerOrderId matching qrId
                Optional<Payment> paymentOpt = Optional.empty();
                if (qrId != null && !qrId.isBlank()) {
                    paymentOpt = paymentRepository.findByProviderOrderId(qrId);
                }

                // If not found by qrId, check shopivo_order_id in notes
                if (paymentOpt.isEmpty()) {
                    String shopivoOrderId = qrEntity.path("notes").path("shopivo_order_id").asText(
                            paymentEntity.path("notes").path("shopivo_order_id").asText(null));
                    if (shopivoOrderId != null && !shopivoOrderId.isBlank()) {
                        try {
                            Long ordId = Long.parseLong(shopivoOrderId);
                            paymentOpt = paymentRepository.findFirstByOrderIdAndProviderOrderByCreatedAtDesc(ordId, "RAZORPAY");
                        } catch (NumberFormatException ignored) {}
                    }
                }

                paymentOpt.ifPresent(payment -> {
                    String paymentCurrency = paymentEntity.path("currency").asText("INR");
                    if (!"INR".equalsIgnoreCase(paymentCurrency)) {
                        log.error("Currency mismatch detected for QR {}: received {}, expected INR", qrId, paymentCurrency);
                        payment.setFailureReason("Currency mismatch: received " + paymentCurrency + ", expected INR");
                        paymentRepository.save(payment);
                        return;
                    }

                    // Strict amount guard: ensure credited amount matches exact order amount in paise
                    long expectedPaise = payment.getAmount().multiply(BigDecimal.valueOf(100)).longValue();
                    if (qrCreditedAmount <= 0 || qrCreditedAmount != expectedPaise) {
                        log.error("Amount mismatch detected for QR {}: received {} paise, expected {} paise",
                                qrId, qrCreditedAmount, expectedPaise);
                        payment.setFailureReason("Amount mismatch / Underpayment detected: received " + qrCreditedAmount + " paise, expected " + expectedPaise);
                        paymentRepository.save(payment);
                        return;
                    }

                    if (payment.getPaymentStatus() == PaymentStatus.INITIATED) {
                        payment.setPaymentStatus(PaymentStatus.SUCCESS);
                        if (providerPaymentId != null && !providerPaymentId.isBlank()) {
                            payment.setProviderPaymentId(providerPaymentId);
                        }
                        payment.setGatewayMethod("upi_qr");
                        if (upiVpa != null && !upiVpa.isBlank()) {
                            payment.setUpiIdSnapshot(upiVpa);
                        }
                        payment.setProviderSignatureVerified(true);
                        paymentRepository.save(payment);

                        Order order = payment.getOrder();
                        if (order.getStatus() == OrderStatus.PENDING) {
                            order.setStatus(OrderStatus.CONFIRMED);
                            orderRepository.save(order);
                        }
                        log.info("Webhook qr_code.credited successfully confirmed order #{} for QR {}", order.getId(), qrId);
                    } else if (payment.getPaymentStatus() == PaymentStatus.FAILED) {
                        // Late Payment Reconciliation: Customer session had cancelled or timed out, but funds were credited
                        log.warn("Late payment received for previously cancelled/failed QR payment #{}. Reconciling to SUCCESS.", payment.getId());
                        payment.setPaymentStatus(PaymentStatus.SUCCESS);
                        payment.setFailureReason("Reconciled from late QR credit");
                        if (providerPaymentId != null && !providerPaymentId.isBlank()) {
                            payment.setProviderPaymentId(providerPaymentId);
                        }
                        payment.setGatewayMethod("upi_qr");
                        if (upiVpa != null && !upiVpa.isBlank()) {
                            payment.setUpiIdSnapshot(upiVpa);
                        }
                        payment.setProviderSignatureVerified(true);
                        paymentRepository.save(payment);

                        Order order = payment.getOrder();
                        if (order.getStatus() == OrderStatus.PENDING) {
                            order.setStatus(OrderStatus.CONFIRMED);
                            orderRepository.save(order);
                            log.info("Reconciled order #{} to CONFIRMED following late webhook arrival", order.getId());
                        } else {
                            log.warn("Order #{} is in status {}. Payment #{} recorded as SUCCESS for merchant audit.",
                                    order.getId(), order.getStatus(), payment.getId());
                        }
                    }
                });
            } else if ("qr_code.created".equalsIgnoreCase(eventType)) {
                log.info("Webhook qr_code.created received and acknowledged for eventId={}", providerEventId);
            } else if ("qr_code.closed".equalsIgnoreCase(eventType)) {
                JsonNode qrEntity = root.path("payload").path("qr_code").path("entity");
                String qrId = qrEntity.path("id").asText(null);
                log.info("Webhook qr_code.closed received for qrId={}, eventId={}", qrId, providerEventId);
                if (qrId != null && !qrId.isBlank()) {
                    paymentRepository.findByProviderOrderId(qrId).ifPresent(payment -> {
                        if (payment.getPaymentStatus() == PaymentStatus.INITIATED) {
                            payment.setPaymentStatus(PaymentStatus.FAILED);
                            payment.setFailureReason("QR code closed or expired at gateway");
                            paymentRepository.save(payment);
                            log.info("Payment #{} updated to FAILED following qr_code.closed", payment.getId());
                        }
                    });
                }
            } else if (eventType.startsWith("payment.dispute.")) {
                log.info("Dispute webhook event received: type={}, eventId={}. Logged for compliance audit.", eventType, providerEventId);
            }

        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            log.error("Failed to parse and process webhook payload: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Malformed webhook payload");
        }
    }

    @Override
    public PaymentResponse processPayment(Long customerId, ProcessPaymentRequest request) {
        // Enforce Requirement 1: Decommission legacy customer simulation endpoint completely
        log.warn("Decommissioned payment endpoint called by customer #{}. Returning 410 GONE.", customerId);
        throw new ResponseStatusException(
                HttpStatus.GONE,
                "The legacy simulated payment endpoint has been decommissioned. " +
                "Normal customer checkouts must use /api/payments/create-gateway-order & /api/payments/verify-gateway-payment or /api/payments/cod."
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getCustomerPayments(Long customerId) {
        return paymentRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public PaymentResponse getPaymentByOrderId(Long orderId, User requester) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment details not found for order: " + orderId));

        if (payment.getPaymentStatus() == PaymentStatus.INITIATED && payment.getOrder() != null) {
            Order o = payment.getOrder();
            if (o.getStatus() == OrderStatus.PENDING && o.getPaymentExpiresAt() != null && o.getPaymentExpiresAt().isBefore(Instant.now())) {
                payment.setPaymentStatus(PaymentStatus.FAILED);
                payment.setFailureReason("Payment session expired. Please generate a new payment QR code.");
                payment = paymentRepository.save(payment);
            }
        }

        if (requester.getRole() == User.Role.ADMIN) {
            return PaymentResponse.from(payment);
        }

        if (requester.getRole() == User.Role.CUSTOMER) {
            if (!payment.getCustomer().getId().equals(requester.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this payment record");
            }
            return PaymentResponse.from(payment);
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getAllPaymentsForAdmin(Pageable pageable) {
        return paymentRepository.findAllPagedForAdmin(pageable)
                .map(PaymentResponse::from);
    }

    @Override
    @Transactional
    public QrPaymentDto createQrPayment(Long customerId, Long orderId) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        // 1. Authorization: Only the ordering customer can initiate payment
        if (!order.getCustomer().getId().equals(customerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to pay for this order");
        }

        // 2. Order status validations
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot pay for a cancelled order");
        }

        // 3. Expiry and Session Management: Exactly 10 minutes (600 seconds)
        Instant sessionExpiresAt = Instant.now().plus(10, java.time.temporal.ChronoUnit.MINUTES);
        order.setPaymentExpiresAt(sessionExpiresAt);
        orderRepository.save(order);

        // 4. Prevent duplicate payment for already successful orders
        if (paymentRepository.existsByOrderIdAndPaymentStatus(order.getId(), PaymentStatus.SUCCESS)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This order has already been paid successfully");
        }

        long amountInPaise = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        String customerFullName = customer.getFirstName() + (customer.getLastName() != null ? " " + customer.getLastName() : "");
        String orderRef = order.getOrderReference() != null ? order.getOrderReference() : ("SHV-" + order.getId());

        // 5. Generate Dynamic QR via Gateway abstraction
        GatewayQrCodeResponse gwQr = paymentGatewayService.createQrCode(
                order.getId(),
                order.getTotalAmount(),
                "INR",
                "Payment for " + orderRef,
                sessionExpiresAt.getEpochSecond()
        );

        // 6. Handle Seamless Fallback if standalone QR API is inactive on merchant account
        if (gwQr.fallbackMode() != null && "STANDARD_CHECKOUT_FALLBACK".equalsIgnoreCase(gwQr.fallbackMode())) {
            log.info("QR standalone API inactive or error. Generating standard gateway order fallback for Shopivo order {}", orderRef);
            GatewayOrderDto gwOrder = createGatewayOrder(customerId, new CreateGatewayOrderRequest(order.getId()));

            return QrPaymentDto.builder()
                    .orderId(order.getId())
                    .orderReference(orderRef)
                    .mode("STANDARD_CHECKOUT_FALLBACK")
                    .gatewayOrderId(gwOrder.gatewayOrderId())
                    .amount(order.getTotalAmount())
                    .amountInPaise(amountInPaise)
                    .currency("INR")
                    .closeBy(sessionExpiresAt.getEpochSecond())
                    .keyId(gwOrder.keyId())
                    .customerName(customerFullName)
                    .customerEmail(customer.getEmail())
                    .customerPhone(order.getShippingPhone())
                    .fallbackReason(gwQr.fallbackReason())
                    .build();
        }

        // 7. Persist / update Payment record for standalone QR session
        Optional<Payment> existingPaymentOpt = paymentRepository.findFirstByOrderIdAndProviderOrderByCreatedAtDesc(order.getId(), "RAZORPAY");
        Payment payment;
        if (existingPaymentOpt.isPresent() && existingPaymentOpt.get().getPaymentStatus() == PaymentStatus.INITIATED) {
            payment = existingPaymentOpt.get();
            payment.setProviderOrderId(gwQr.qrCodeId());
            payment.setGatewayMethod("upi_qr");
            payment.setTransactionId("QR-" + gwQr.qrCodeId());
        } else {
            payment = Payment.builder()
                    .order(order)
                    .customer(customer)
                    .provider("RAZORPAY")
                    .paymentGateway("RAZORPAY")
                    .paymentMethod(PaymentMethod.RAZORPAY)
                    .gatewayMethod("upi_qr")
                    .paymentStatus(PaymentStatus.INITIATED)
                    .providerOrderId(gwQr.qrCodeId())
                    .amount(order.getTotalAmount())
                    .transactionId("QR-" + gwQr.qrCodeId())
                    .providerSignatureVerified(false)
                    .build();
        }
        paymentRepository.save(payment);

        return QrPaymentDto.builder()
                .orderId(order.getId())
                .orderReference(orderRef)
                .mode("RAZORPAY_QR_CODE")
                .qrCodeId(gwQr.qrCodeId())
                .imageUrl(gwQr.imageUrl())
                .amount(order.getTotalAmount())
                .amountInPaise(amountInPaise)
                .currency("INR")
                .closeBy(sessionExpiresAt.getEpochSecond())
                .keyId(paymentGatewayService.getPublicKeyId())
                .customerName(customerFullName)
                .customerEmail(customer.getEmail())
                .customerPhone(order.getShippingPhone())
                .build();
    }

    @Override
    @Transactional
    public boolean cancelQrPayment(Long customerId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Optional<Payment> paymentOpt = paymentRepository.findFirstByOrderIdAndProviderOrderByCreatedAtDesc(order.getId(), "RAZORPAY");
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            if (payment.getPaymentStatus() == PaymentStatus.INITIATED && payment.getProviderOrderId() != null && payment.getProviderOrderId().startsWith("qr_")) {
                paymentGatewayService.closeQrCode(payment.getProviderOrderId());
                payment.setPaymentStatus(PaymentStatus.FAILED);
                payment.setFailureReason("Customer cancelled QR payment session");
                paymentRepository.save(payment);
                log.info("Cancelled QR payment session for order #{}", orderId);
                return true;
            }
        }
        return false;
    }
}
