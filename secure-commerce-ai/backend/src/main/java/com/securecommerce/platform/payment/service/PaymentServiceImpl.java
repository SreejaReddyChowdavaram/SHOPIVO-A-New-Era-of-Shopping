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
import com.securecommerce.platform.payment.gateway.PaymentGatewayService;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.payment.repository.PaymentWebhookEventRepository;
import com.securecommerce.platform.returns.entity.RefundStatus;
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

        // 5. IDEMPOTENCY: Check if an active INITIATED gateway payment already exists for this order
        Optional<Payment> activePaymentOpt = paymentRepository.findFirstByOrderIdAndProviderOrderByCreatedAtDesc(order.getId(), "RAZORPAY");
        if (activePaymentOpt.isPresent()) {
            Payment activePayment = activePaymentOpt.get();
            if (activePayment.getPaymentStatus() == PaymentStatus.INITIATED && activePayment.getProviderOrderId() != null) {
                log.info("Idempotent hit: Reusing active gateway order {} for Shopivo order #{}",
                        activePayment.getProviderOrderId(), order.getId());
                return new GatewayOrderDto(
                        order.getId(),
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

        log.info("Created new gateway order {} for Shopivo order #{} (amount={} paise)",
                gwOrder.gatewayOrderId(), order.getId(), amountInPaise);

        return new GatewayOrderDto(
                order.getId(),
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
        if (!"captured".equals(gwStatus) && !"authorized".equals(gwStatus)) {
            log.warn("Payment is not in captured/authorized status: status={}", gwStatus);
            Optional<Payment> initiatedPayment = paymentRepository.findByProviderOrderId(request.razorpayOrderId());
            initiatedPayment.ifPresent(p -> {
                p.setPaymentStatus(PaymentStatus.FAILED);
                p.setFailureReason("Payment not captured by gateway: " + gwStatus);
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
            if ("payment.captured".equalsIgnoreCase(eventType) && providerOrderId != null) {
                Optional<Payment> paymentOpt = paymentRepository.findByProviderOrderId(providerOrderId);
                paymentOpt.ifPresent(payment -> {
                    if (payment.getPaymentStatus() == PaymentStatus.INITIATED) {
                        payment.setPaymentStatus(PaymentStatus.SUCCESS);
                        payment.setProviderPaymentId(providerPaymentId);
                        payment.setGatewayMethod(gatewayMethod);
                        payment.setProviderSignatureVerified(true);
                        paymentRepository.save(payment);

                        Order order = payment.getOrder();
                        if (order.getStatus() == OrderStatus.PENDING) {
                            order.setStatus(OrderStatus.CONFIRMED);
                            orderRepository.save(order);
                        }
                        log.info("Webhook updated order #{} to CONFIRMED via payment.captured", order.getId());
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

                if (refundPaymentId != null) {
                    Optional<Payment> paymentOpt = paymentRepository.findByProviderPaymentId(refundPaymentId);
                    paymentOpt.ifPresent(payment -> {
                        if (payment.getPaymentStatus().canTransitionTo(PaymentStatus.FAILED)) {
                            payment.setPaymentStatus(PaymentStatus.FAILED);
                            payment.setFailureReason(refundEntity.path("error_description").asText("Refund failed at gateway"));
                            paymentRepository.save(payment);
                            log.warn("Webhook marked refund as FAILED for payment {}", payment.getId());
                        }
                    });
                }
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
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(Long orderId, User requester) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment details not found for order: " + orderId));

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
}
