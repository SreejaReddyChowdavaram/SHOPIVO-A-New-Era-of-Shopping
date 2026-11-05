package com.securecommerce.platform.returns.service;

import com.securecommerce.platform.notification.entity.NotificationType;
import com.securecommerce.platform.notification.service.NotificationService;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderItem;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentMethod;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.returns.dto.*;
import com.securecommerce.platform.returns.entity.Refund;
import com.securecommerce.platform.returns.entity.RefundStatus;
import com.securecommerce.platform.returns.entity.ReturnRequest;
import com.securecommerce.platform.returns.entity.ReturnStatus;
import com.securecommerce.platform.returns.repository.RefundRepository;
import com.securecommerce.platform.returns.repository.ReturnRequestRepository;
import com.securecommerce.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.service.EventLoggingService;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReturnServiceImpl implements ReturnService {

    private final ReturnRequestRepository returnRequestRepository;
    private final RefundRepository refundRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;
    private final com.securecommerce.platform.payment.gateway.PaymentGatewayService paymentGatewayService;
    private final EventLoggingService eventLoggingService;

    private static final List<ReturnStatus> ACTIVE_RETURN_STATUSES = List.of(
            ReturnStatus.REQUESTED,
            ReturnStatus.APPROVED,
            ReturnStatus.COMPLETED
    );

    @Override
    @Transactional(readOnly = true)
    public ReturnEligibilityResponse checkEligibility(Long orderId, Long orderItemId, User customer) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getCustomer().getId().equals(customer.getId()) && customer.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this order");
        }

        if (order.getStatus() != OrderStatus.DELIVERED) {
            return new ReturnEligibilityResponse(
                    false,
                    String.format("Order in '%s' status is not eligible for return. Only DELIVERED orders can be returned.", order.getStatus()),
                    false,
                    null,
                    BigDecimal.ZERO
            );
        }

        // Check if existing return is already recorded
        List<ReturnRequest> existingReturns = returnRequestRepository.findByOrderIdWithDetails(orderId);
        Optional<ReturnRequest> activeReturn = existingReturns.stream()
                .filter(r -> ACTIVE_RETURN_STATUSES.contains(r.getStatus()))
                .filter(r -> orderItemId == null || r.getOrderItem() == null || r.getOrderItem().getId().equals(orderItemId))
                .findFirst();

        if (activeReturn.isPresent()) {
            ReturnRequest req = activeReturn.get();
            Optional<Refund> ref = refundRepository.findByReturnRequestId(req.getId());
            return new ReturnEligibilityResponse(
                    false,
                    String.format("A return request (#%d) is already %s for this item.", req.getId(), req.getStatus()),
                    true,
                    ReturnResponse.from(req, ref.orElse(null)),
                    req.getRefundAmount()
            );
        }

        BigDecimal estimatedRefund = order.getTotalAmount();
        if (orderItemId != null) {
            OrderItem item = order.getItems().stream()
                    .filter(i -> i.getId().equals(orderItemId))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order item not found in this order"));
            estimatedRefund = item.getLineTotal();
        }

        return new ReturnEligibilityResponse(
                true,
                "Delivered order is eligible for return within policy window.",
                false,
                null,
                estimatedRefund
        );
    }

    @Override
    public ReturnResponse requestReturn(CreateReturnRequest request, User customer) {
        Order order = orderRepository.findByIdWithItems(request.orderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getCustomer().getId().equals(customer.getId()) && customer.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to return this order");
        }

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Cannot return order in '%s' status. Only DELIVERED orders are eligible.", order.getStatus()));
        }

        // Check duplicate active returns
        if (request.orderItemId() != null) {
            boolean exists = returnRequestRepository.existsByOrderIdAndOrderItemIdAndStatusNotIn(
                    request.orderId(), request.orderItemId(), List.of(ReturnStatus.CANCELLED, ReturnStatus.REJECTED)
            );
            if (exists) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An active return request already exists for this order item");
            }
        } else {
            boolean exists = returnRequestRepository.existsByOrderIdAndStatusNotIn(
                    request.orderId(), List.of(ReturnStatus.CANCELLED, ReturnStatus.REJECTED)
            );
            if (exists) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An active return request already exists for this order");
            }
        }

        OrderItem targetItem = null;
        BigDecimal refundAmount = order.getTotalAmount();

        if (request.orderItemId() != null) {
            targetItem = order.getItems().stream()
                    .filter(i -> i.getId().equals(request.orderItemId()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Specified item does not belong to this order"));
            refundAmount = targetItem.getLineTotal();
        }

        ReturnRequest returnRequest = ReturnRequest.builder()
                .order(order)
                .customer(customer)
                .orderItem(targetItem)
                .reason(request.reason().trim())
                .returnNote(request.returnNote() != null ? request.returnNote().trim() : null)
                .status(ReturnStatus.REQUESTED)
                .refundAmount(refundAmount)
                .build();

        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        eventLoggingService.logEvent(
                EventType.RETURN_REQUESTED,
                customer.getId(),
                "RETURN",
                String.valueOf(saved.getId()),
                Map.of(
                        "orderId", order.getId(),
                        "refundAmount", saved.getRefundAmount(),
                        "reason", saved.getReason() != null ? saved.getReason() : "",
                        "orderItemId", request.orderItemId() != null ? request.orderItemId() : 0
                )
        );

        log.info("Return requested: returnId={}, orderId={}, customerId={}, amount={}",
                saved.getId(), order.getId(), customer.getId(), saved.getRefundAmount());

        // Emit RETURN_REQUESTED notification
        try {
            notificationService.createNotification(
                    customer,
                    NotificationType.RETURN_REQUESTED,
                    "Return Request Submitted",
                    String.format("Return request #%d submitted for Order #%d (Estimated Refund: ₹%s).", saved.getId(), order.getId(), saved.getRefundAmount()),
                    "RETURN",
                    saved.getId()
            );
        } catch (Exception e) {
            log.error("Failed to generate RETURN_REQUESTED notification for return #{}: {}", saved.getId(), e.getMessage());
        }

        return ReturnResponse.from(saved, null);
    }

    @Override
    public ReturnResponse processSandboxApproval(Long returnId, User customer) {
        return processAdminApproval(returnId, customer);
    }

    @Override
    public ReturnResponse processAdminApproval(Long returnId, User customer) {
        ReturnRequest returnRequest = returnRequestRepository.findByIdWithDetails(returnId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Return request not found"));

        if (!returnRequest.getCustomer().getId().equals(customer.getId()) && customer.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this return request");
        }

        // Idempotency: Return existing refund if already completed or processing
        Optional<Refund> existingRefund = refundRepository.findByReturnRequestId(returnId);
        if (returnRequest.getStatus() == ReturnStatus.COMPLETED && existingRefund.isPresent()) {
            return ReturnResponse.from(returnRequest, existingRefund.get());
        }

        if (existingRefund.isPresent() && (
                existingRefund.get().getRefundStatus() == RefundStatus.REFUNDED ||
                existingRefund.get().getRefundStatus() == RefundStatus.REFUND_PROCESSING)) {
            log.info("Refund already initiated for return request #{}, returning existing refund", returnId);
            return ReturnResponse.from(returnRequest, existingRefund.get());
        }

        if (returnRequest.getStatus() != ReturnStatus.REQUESTED && returnRequest.getStatus() != ReturnStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Cannot approve return in '%s' status.", returnRequest.getStatus()));
        }

        Instant now = Instant.now();
        returnRequest.setStatus(ReturnStatus.APPROVED);
        returnRequest.setApprovedAt(now);

        // 1. Check or fetch payment record for the order
        Optional<Payment> optionalPayment = paymentRepository.findByOrderId(returnRequest.getOrder().getId());
        Payment payment = optionalPayment.orElse(null);

        // Set intermediate REFUND_REQUESTED status on Payment
        if (payment != null && payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            if (payment.getPaymentStatus().canTransitionTo(PaymentStatus.REFUND_REQUESTED)) {
                payment.setPaymentStatus(PaymentStatus.REFUND_REQUESTED);
                paymentRepository.save(payment);
            }
        }

        PaymentMethod method = payment != null ? payment.getPaymentMethod() : PaymentMethod.COD;
        String refundTxnId;
        String providerRefundId = null;
        RefundStatus targetRefundStatus = RefundStatus.REFUND_PROCESSING;
        PaymentStatus targetPaymentStatus = PaymentStatus.REFUND_PROCESSING;

        // If online payment via Razorpay, invoke gateway refund
        if (payment != null && "RAZORPAY".equalsIgnoreCase(payment.getProvider()) && payment.getProviderPaymentId() != null) {
            try {
                com.securecommerce.platform.payment.gateway.GatewayRefundResponse gwRefund = paymentGatewayService.refundPayment(
                        payment.getProviderPaymentId(),
                        returnRequest.getRefundAmount(),
                        "Approved return for return request #" + returnRequest.getId()
                );
                providerRefundId = gwRefund.refundId();
                refundTxnId = "RZP-REFUND-" + providerRefundId;

                if ("processed".equalsIgnoreCase(gwRefund.status())) {
                    targetRefundStatus = RefundStatus.REFUNDED;
                    targetPaymentStatus = PaymentStatus.REFUNDED;
                } else {
                    targetRefundStatus = RefundStatus.REFUND_PROCESSING;
                    targetPaymentStatus = PaymentStatus.REFUND_PROCESSING;
                }
            } catch (Exception e) {
                log.error("Gateway refund failed for payment {}: {}", payment.getProviderPaymentId(), e.getMessage());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gateway refund processing failed: " + e.getMessage());
            }
        } else {
            refundTxnId = (method == PaymentMethod.COD ? "COD-REFUND-" : "DEMO-REFUND-") +
                    UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
            targetRefundStatus = RefundStatus.REFUNDED;
            targetPaymentStatus = PaymentStatus.REFUNDED;
        }

        final RefundStatus finalRefundStatus = targetRefundStatus;
        final String finalRefundTxnId = refundTxnId;

        // 2. Create Refund Record if not already created
        Refund refund = existingRefund.orElseGet(() ->
                Refund.builder()
                        .returnRequest(returnRequest)
                        .order(returnRequest.getOrder())
                        .customer(returnRequest.getCustomer())
                        .payment(payment)
                        .refundAmount(returnRequest.getRefundAmount())
                        .refundStatus(finalRefundStatus)
                        .refundTransactionId(finalRefundTxnId)
                        .paymentMethod(method)
                        .processedAt(now)
                        .build()
        );

        refund.setRefundStatus(targetRefundStatus);
        refund.setRefundTransactionId(refundTxnId);
        refund.setProcessedAt(now);
        Refund savedRefund = refundRepository.save(refund);

        eventLoggingService.logEvent(
                EventType.REFUND_CREATED,
                savedRefund.getCustomer().getId(),
                "REFUND",
                String.valueOf(savedRefund.getId()),
                Map.of(
                        "orderId", savedRefund.getOrder().getId(),
                        "refundAmount", savedRefund.getRefundAmount(),
                        "status", savedRefund.getRefundStatus().name(),
                        "returnRequestId", returnRequest.getId()
                )
        );

        // 3. Mark payment status
        if (payment != null) {
            if (payment.getPaymentStatus().canTransitionTo(targetPaymentStatus)) {
                payment.setPaymentStatus(targetPaymentStatus);
            }
            if (providerRefundId != null) {
                payment.setRefundProviderId(providerRefundId);
            }
            paymentRepository.save(payment);
        }

        // 4. Restore product stock in available inventory
        if (returnRequest.getOrderItem() != null && returnRequest.getOrderItem().getProduct() != null) {
            Product product = returnRequest.getOrderItem().getProduct();
            product.setStockQuantity(product.getStockQuantity() + returnRequest.getOrderItem().getQuantity());
            productRepository.save(product);
        } else if (returnRequest.getOrder().getItems() != null) {
            for (OrderItem item : returnRequest.getOrder().getItems()) {
                if (item.getProduct() != null) {
                    Product p = item.getProduct();
                    p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
                    productRepository.save(p);
                }
            }
        }

        // 5. Update return request status
        if (targetRefundStatus == RefundStatus.REFUNDED) {
            returnRequest.setStatus(ReturnStatus.COMPLETED);
            returnRequest.setCompletedAt(now);
        } else {
            returnRequest.setStatus(ReturnStatus.APPROVED);
        }
        ReturnRequest completed = returnRequestRepository.save(returnRequest);

        log.info("Return approval processed: returnId={}, refundId={}, txnId={}, status={}, amount={}",
                completed.getId(), savedRefund.getId(), refundTxnId, targetRefundStatus, completed.getRefundAmount());

        // Emit notifications for return approval, refund success, and completion
        try {
            notificationService.createNotification(
                    completed.getCustomer(),
                    NotificationType.RETURN_APPROVED,
                    "Return Request Approved",
                    String.format("Your return request #%d for Order #%d has been approved.", completed.getId(), completed.getOrder().getId()),
                    "RETURN",
                    completed.getId()
            );

            notificationService.createNotification(
                    completed.getCustomer(),
                    NotificationType.REFUND_SUCCESS,
                    "Refund Processed Successfully",
                    String.format("Refund of ₹%s has been successfully processed (Txn: %s).", savedRefund.getRefundAmount(), refundTxnId),
                    "REFUND",
                    savedRefund.getId()
            );

            notificationService.createNotification(
                    completed.getCustomer(),
                    NotificationType.RETURN_COMPLETED,
                    "Return Completed",
                    String.format("Return #%d has been marked completed.", completed.getId()),
                    "RETURN",
                    completed.getId()
            );
        } catch (Exception e) {
            log.error("Failed to generate return/refund notifications for return #{}: {}", completed.getId(), e.getMessage());
        }

        return ReturnResponse.from(completed, savedRefund);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReturnResponse> getMyReturns(User customer) {
        List<ReturnRequest> returns = returnRequestRepository.findByCustomerIdWithDetails(customer.getId());
        return returns.stream()
                .map(r -> {
                    Optional<Refund> ref = refundRepository.findByReturnRequestId(r.getId());
                    return ReturnResponse.from(r, ref.orElse(null));
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponse> getMyRefunds(User customer) {
        List<Refund> refunds = refundRepository.findByCustomerIdWithDetails(customer.getId());
        return refunds.stream()
                .map(RefundResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnResponse getReturnById(Long id, User customer) {
        ReturnRequest req = returnRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Return request not found"));

        if (!req.getCustomer().getId().equals(customer.getId()) && customer.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this return request");
        }

        Optional<Refund> ref = refundRepository.findByReturnRequestId(req.getId());
        return ReturnResponse.from(req, ref.orElse(null));
    }

    @Override
    public ReturnResponse cancelReturn(Long id, User customer) {
        ReturnRequest req = returnRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Return request not found"));

        if (!req.getCustomer().getId().equals(customer.getId()) && customer.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this return request");
        }

        if (req.getStatus() != ReturnStatus.REQUESTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Cannot cancel return request in '%s' status.", req.getStatus()));
        }

        req.setStatus(ReturnStatus.CANCELLED);
        ReturnRequest updated = returnRequestRepository.save(req);

        log.info("Return request cancelled by customer: returnId={}, customerId={}", id, customer.getId());

        return ReturnResponse.from(updated, null);
    }
}
