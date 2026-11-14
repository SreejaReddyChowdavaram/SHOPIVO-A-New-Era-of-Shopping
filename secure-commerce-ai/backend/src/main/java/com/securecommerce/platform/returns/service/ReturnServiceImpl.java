package com.securecommerce.platform.returns.service;

import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.service.EventLoggingService;
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
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

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
            ReturnStatus.PENDING_SELLER_APPROVAL,
            ReturnStatus.SELLER_APPROVED,
            ReturnStatus.APPROVED,
            ReturnStatus.REFUND_INITIATED,
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
                    String.format("A refund/return request (#%d) is already %s for this item.", req.getId(), req.getStatus()),
                    true,
                    ReturnResponse.from(req, ref.orElse(null), paymentGatewayService.getMode()),
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
                "Order is eligible for refund request with seller approval.",
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
                    request.orderId(), request.orderItemId(), List.of(ReturnStatus.CANCELLED, ReturnStatus.REJECTED, ReturnStatus.SELLER_REJECTED)
            );
            if (exists) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An active refund request already exists for this order item");
            }
        } else {
            boolean exists = returnRequestRepository.existsByOrderIdAndStatusNotIn(
                    request.orderId(), List.of(ReturnStatus.CANCELLED, ReturnStatus.REJECTED, ReturnStatus.SELLER_REJECTED)
            );
            if (exists) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An active refund request already exists for this order");
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

        User seller = null;
        if (targetItem != null && targetItem.getSeller() != null) {
            seller = targetItem.getSeller();
        } else if (order.getItems() != null && !order.getItems().isEmpty()) {
            seller = order.getItems().get(0).getSeller();
        }

        ReturnRequest returnRequest = ReturnRequest.builder()
                .order(order)
                .customer(customer)
                .seller(seller)
                .orderItem(targetItem)
                .reason(request.reason().trim())
                .returnNote(request.returnNote() != null ? request.returnNote().trim() : null)
                .status(ReturnStatus.REQUESTED)
                .sellerApprovalStatus("PENDING_SELLER_APPROVAL")
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
                        "orderItemId", request.orderItemId() != null ? request.orderItemId() : 0,
                        "sellerId", seller != null ? seller.getId() : 0
                )
        );

        log.info("Refund request created: id={}, orderId={}, customerId={}, sellerId={}, amount={}",
                saved.getId(), order.getId(), customer.getId(), seller != null ? seller.getId() : null, saved.getRefundAmount());

        // Notify customer
        try {
            notificationService.createNotification(
                    customer,
                    NotificationType.RETURN_REQUESTED,
                    "Refund Request Submitted",
                    String.format("Refund request #%d submitted for Order #%d (₹%s). Status: Pending Seller Approval.",
                            saved.getId(), order.getId(), saved.getRefundAmount()),
                    "RETURN",
                    saved.getId()
            );
        } catch (Exception e) {
            log.error("Failed to generate notification: {}", e.getMessage());
        }

        return ReturnResponse.from(saved, null, paymentGatewayService.getMode());
    }

    @Override
    @Transactional
    public ReturnResponse approveRefundAsSeller(Long returnId, User seller) {
        // 1. Acquire pessimistic write lock to serialize concurrent seller approvals
        ReturnRequest returnRequest = returnRequestRepository.findByIdForUpdate(returnId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Refund request not found"));

        // 2. Verify seller ownership of this order / refund request
        Long requestSellerId = returnRequest.getSeller() != null ? returnRequest.getSeller().getId() : null;
        if (requestSellerId == null && returnRequest.getOrderItem() != null && returnRequest.getOrderItem().getSeller() != null) {
            requestSellerId = returnRequest.getOrderItem().getSeller().getId();
        }
        if (requestSellerId == null && returnRequest.getOrder() != null && returnRequest.getOrder().getItems() != null && !returnRequest.getOrder().getItems().isEmpty()) {
            requestSellerId = returnRequest.getOrder().getItems().get(0).getSeller().getId();
        }

        if (requestSellerId == null || !requestSellerId.equals(seller.getId())) {
            log.warn("Unauthorized seller refund approval attempt: requestSellerId={}, attemptingSellerId={}", requestSellerId, seller.getId());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to approve refund requests belonging to other sellers.");
        }

        // 3. Validate not already rejected
        if (returnRequest.getStatus() == ReturnStatus.REJECTED || "SELLER_REJECTED".equals(returnRequest.getSellerApprovalStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot approve a refund request that has already been rejected.");
        }

        // 4. Strict Idempotency & In-Flight Status Guards
        Optional<Refund> existingRefund = refundRepository.findByReturnRequestId(returnId);
        if (returnRequest.getStatus() == ReturnStatus.COMPLETED && existingRefund.isPresent() && existingRefund.get().getRefundStatus() == RefundStatus.REFUNDED) {
            log.info("Refund request #{} already completed and refunded. Returning existing state.", returnId);
            return ReturnResponse.from(returnRequest, existingRefund.get(), paymentGatewayService.getMode());
        }

        if (existingRefund.isPresent()) {
            Refund r = existingRefund.get();
            if (r.getRefundStatus() == RefundStatus.REFUNDED) {
                log.info("Refund #{} already executed (REFUNDED) for return #{}. Returning existing state.", r.getId(), returnId);
                return ReturnResponse.from(returnRequest, r, paymentGatewayService.getMode());
            }
            if (r.getRefundStatus() == RefundStatus.REFUND_PROCESSING) {
                log.info("Refund #{} is currently in REFUND_PROCESSING for return #{}. Treating as already-submitted.", r.getId(), returnId);
                // Reconcile uncertain gateway status if provider refund ID is available
                if (r.getProviderRefundId() != null && !r.getProviderRefundId().isBlank()) {
                    try {
                        com.securecommerce.platform.payment.gateway.GatewayRefundResponse gwStatus = paymentGatewayService.fetchRefund(r.getProviderRefundId());
                        if (gwStatus != null && "processed".equalsIgnoreCase(gwStatus.status())) {
                            r.setRefundStatus(RefundStatus.REFUNDED);
                            r.setProcessedAt(Instant.now());
                            refundRepository.save(r);

                            returnRequest.setStatus(ReturnStatus.COMPLETED);
                            returnRequest.setCompletedAt(Instant.now());
                            returnRequestRepository.save(returnRequest);

                            if (r.getPayment() != null) {
                                Payment p = r.getPayment();
                                p.setPaymentStatus(PaymentStatus.REFUNDED);
                                paymentRepository.save(p);
                            }
                            log.info("Authoritatively reconciled refund #{} to REFUNDED for return #{}", r.getId(), returnId);
                            return ReturnResponse.from(returnRequest, r, paymentGatewayService.getMode());
                        }
                    } catch (Exception e) {
                        log.warn("Failed to reconcile gateway refund status for {}: {}", r.getProviderRefundId(), e.getMessage());
                    }
                }
                // Return existing in-flight state without calling refund gateway again!
                return ReturnResponse.from(returnRequest, r, paymentGatewayService.getMode());
            }
        }

        Instant now = Instant.now();
        returnRequest.setSeller(seller);
        returnRequest.setSellerApprovalStatus("SELLER_APPROVED");
        returnRequest.setSellerApprovedAt(now);
        returnRequest.setStatus(ReturnStatus.APPROVED);
        returnRequest.setApprovedAt(now);

        // 5. Authoritative platform-level refund processing
        return executePlatformRefund(returnRequest, existingRefund.orElse(null), now);
    }

    @Override
    @Transactional
    public ReturnResponse rejectRefundAsSeller(Long returnId, RejectReturnRequest request, User seller) {
        ReturnRequest returnRequest = returnRequestRepository.findByIdForUpdate(returnId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Refund request not found"));

        // Verify seller ownership
        Long requestSellerId = returnRequest.getSeller() != null ? returnRequest.getSeller().getId() : null;
        if (requestSellerId == null && returnRequest.getOrderItem() != null && returnRequest.getOrderItem().getSeller() != null) {
            requestSellerId = returnRequest.getOrderItem().getSeller().getId();
        }
        if (requestSellerId == null && returnRequest.getOrder() != null && returnRequest.getOrder().getItems() != null && !returnRequest.getOrder().getItems().isEmpty()) {
            requestSellerId = returnRequest.getOrder().getItems().get(0).getSeller().getId();
        }

        if (requestSellerId == null || !requestSellerId.equals(seller.getId())) {
            log.warn("Unauthorized seller refund rejection attempt: requestSellerId={}, attemptingSellerId={}", requestSellerId, seller.getId());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to reject refund requests belonging to other sellers.");
        }

        // Validate not already approved or completed or in refund process
        if (returnRequest.getStatus() == ReturnStatus.COMPLETED || returnRequest.getStatus() == ReturnStatus.APPROVED || returnRequest.getStatus() == ReturnStatus.REFUND_INITIATED || "SELLER_APPROVED".equals(returnRequest.getSellerApprovalStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot reject a refund request that has already been approved or completed.");
        }

        if (request.reason() == null || request.reason().trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason is required.");
        }

        Instant now = Instant.now();
        returnRequest.setSeller(seller);
        returnRequest.setSellerApprovalStatus("SELLER_REJECTED");
        returnRequest.setSellerRejectionReason(request.reason().trim());
        returnRequest.setSellerRejectedAt(now);
        returnRequest.setStatus(ReturnStatus.REJECTED);
        returnRequest.setRejectedAt(now);

        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        // Notify customer
        try {
            notificationService.createNotification(
                    saved.getCustomer(),
                    NotificationType.RETURN_REJECTED,
                    "Refund Request Rejected by Seller",
                    String.format("Seller %s rejected your refund request for Order #%d. Reason: %s",
                            seller.getFullName(), saved.getOrder().getId(), request.reason().trim()),
                    "RETURN",
                    saved.getId()
            );
        } catch (Exception e) {
            log.error("Failed to notify customer on refund rejection: {}", e.getMessage());
        }

        log.info("Seller ID={} rejected refund request #{}: {}", seller.getId(), saved.getId(), request.reason().trim());

        return ReturnResponse.from(saved, null, paymentGatewayService.getMode());
    }

    private ReturnResponse executePlatformRefund(ReturnRequest returnRequest, Refund existingRefund, Instant now) {
        // 1. Fetch payment record
        Optional<Payment> optionalPayment = paymentRepository.findByOrderId(returnRequest.getOrder().getId());
        Payment payment = optionalPayment.orElse(null);

        BigDecimal capturedAmount = payment != null && payment.getAmount() != null
                ? payment.getAmount()
                : returnRequest.getOrder().getTotalAmount();

        // 2. Prevent over-refunding
        BigDecimal previouslyRefunded = BigDecimal.ZERO;
        if (existingRefund != null && existingRefund.getRefundStatus() == RefundStatus.REFUNDED) {
            previouslyRefunded = existingRefund.getRefundAmount();
        }
        BigDecimal availableToRefund = capturedAmount.subtract(previouslyRefunded);
        if (returnRequest.getRefundAmount().compareTo(availableToRefund) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Requested refund ₹%s exceeds refundable balance ₹%s.",
                            returnRequest.getRefundAmount(), availableToRefund));
        }

        PaymentMethod method = payment != null ? payment.getPaymentMethod() : PaymentMethod.COD;
        String providerRefundId = null;
        String refundTxnId;
        RefundStatus targetRefundStatus = RefundStatus.REFUNDED;
        PaymentStatus targetPaymentStatus = PaymentStatus.REFUNDED;
        String idempotencyReceipt = "RET_REFUND_" + returnRequest.getId();

        // 3. Razorpay Gateway Refund Integration with Idempotency Receipt
        if (payment != null && "RAZORPAY".equalsIgnoreCase(payment.getProvider()) && payment.getProviderPaymentId() != null) {
            try {
                com.securecommerce.platform.payment.gateway.GatewayRefundResponse gwRefund = paymentGatewayService.refundPayment(
                        payment.getProviderPaymentId(),
                        returnRequest.getRefundAmount(),
                        "Seller approved refund for request #" + returnRequest.getId(),
                        idempotencyReceipt
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
                log.error("Gateway refund call failed or timed out for payment {}: {}", payment.getProviderPaymentId(), e.getMessage());
                // Handle network timeout safely without blind resubmission
                providerRefundId = existingRefund != null && existingRefund.getProviderRefundId() != null
                        ? existingRefund.getProviderRefundId()
                        : ("rfnd_timeout_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10));
                refundTxnId = "TIMEOUT-REFUND-" + idempotencyReceipt;
                targetRefundStatus = RefundStatus.REFUND_PROCESSING;
                targetPaymentStatus = PaymentStatus.REFUND_PROCESSING;
            }
        } else {
            // COD or simulated direct refund
            providerRefundId = "rfnd_sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            refundTxnId = (method == PaymentMethod.COD ? "COD-REFUND-" : "DEMO-REFUND-") + providerRefundId;
            targetRefundStatus = RefundStatus.REFUNDED;
            targetPaymentStatus = PaymentStatus.REFUNDED;
        }

        // 4. Save Refund Record
        String dest = "Original payment method (" + (payment != null && payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "UPI / Card") + ")";
        final RefundStatus fStatus = targetRefundStatus;
        final String fTxnId = refundTxnId;
        final String fProvId = providerRefundId;

        Refund refund = existingRefund != null ? existingRefund : Refund.builder()
                .returnRequest(returnRequest)
                .order(returnRequest.getOrder())
                .customer(returnRequest.getCustomer())
                .payment(payment)
                .refundAmount(returnRequest.getRefundAmount())
                .refundStatus(fStatus)
                .refundTransactionId(fTxnId)
                .providerRefundId(fProvId)
                .paymentMethod(method)
                .destination(dest)
                .processedAt(now)
                .build();

        refund.setRefundStatus(targetRefundStatus);
        refund.setRefundTransactionId(refundTxnId);
        refund.setProviderRefundId(providerRefundId);
        refund.setDestination(dest);
        refund.setProcessedAt(now);
        Refund savedRefund = refundRepository.save(refund);

        // 5. Update Payment Record
        if (payment != null) {
            payment.setPaymentStatus(targetPaymentStatus);
            payment.setRefundProviderId(providerRefundId);
            paymentRepository.save(payment);
        }

        // 6. Restore Product Stock — Exactly Once Guard
        if (existingRefund == null) {
            restoreInventoryForReturn(returnRequest);
        }

        // 7. Complete Return Request
        if (targetRefundStatus == RefundStatus.REFUNDED) {
            returnRequest.setStatus(ReturnStatus.COMPLETED);
            returnRequest.setCompletedAt(now);
        } else {
            returnRequest.setStatus(ReturnStatus.REFUND_INITIATED);
        }
        ReturnRequest completed = returnRequestRepository.save(returnRequest);

        // 8. Audit event & Notification
        eventLoggingService.logEvent(
                EventType.REFUND_CREATED,
                savedRefund.getCustomer().getId(),
                "REFUND",
                String.valueOf(savedRefund.getId()),
                Map.of(
                        "orderId", savedRefund.getOrder().getId(),
                        "refundAmount", savedRefund.getRefundAmount(),
                        "providerRefundId", providerRefundId != null ? providerRefundId : "",
                        "status", savedRefund.getRefundStatus().name(),
                        "returnRequestId", returnRequest.getId()
                )
        );

        try {
            notificationService.createNotification(
                    returnRequest.getCustomer(),
                    NotificationType.REFUND_SUCCESS,
                    "Refund Processed Successfully",
                    String.format("Your refund of ₹%s for Order #%d has been processed to your original payment method. Ref: %s",
                            savedRefund.getRefundAmount(), savedRefund.getOrder().getId(), savedRefund.getRefundTransactionId()),
                    "REFUND",
                    savedRefund.getId()
            );
        } catch (Exception e) {
            log.error("Failed to notify customer of refund completion: {}", e.getMessage());
        }

        log.info("Authoritative refund completed: returnId={}, refundId={}, providerRefundId={}, amount=₹{}",
                completed.getId(), savedRefund.getId(), providerRefundId, savedRefund.getRefundAmount());

        return ReturnResponse.from(completed, savedRefund, paymentGatewayService.getMode());
    }

    private void restoreInventoryForReturn(ReturnRequest returnRequest) {
        if (returnRequest.getOrderItem() != null && returnRequest.getOrderItem().getProduct() != null) {
            Product product = returnRequest.getOrderItem().getProduct();
            product.setStockQuantity(product.getStockQuantity() + returnRequest.getOrderItem().getQuantity());
            productRepository.save(product);
            log.info("Restored inventory for product #{} (quantity: +{})", product.getId(), returnRequest.getOrderItem().getQuantity());
        } else if (returnRequest.getOrder() != null && returnRequest.getOrder().getItems() != null) {
            for (OrderItem item : returnRequest.getOrder().getItems()) {
                if (item.getProduct() != null) {
                    Product p = item.getProduct();
                    p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
                    productRepository.save(p);
                    log.info("Restored inventory for order item product #{} (quantity: +{})", p.getId(), item.getQuantity());
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public SellerRefundSummaryDto getSellerRefunds(User seller, String status, String search) {
        List<ReturnRequest> allSellerRequests = returnRequestRepository.findBySellerIdWithDetails(seller.getId());

        long total = allSellerRequests.size();
        long pending = allSellerRequests.stream()
                .filter(r -> "PENDING_SELLER_APPROVAL".equalsIgnoreCase(r.getSellerApprovalStatus())
                        || r.getStatus() == ReturnStatus.REQUESTED
                        || r.getStatus() == ReturnStatus.PENDING_SELLER_APPROVAL)
                .count();
        long approved = allSellerRequests.stream()
                .filter(r -> "SELLER_APPROVED".equalsIgnoreCase(r.getSellerApprovalStatus())
                        || r.getStatus() == ReturnStatus.APPROVED
                        || r.getStatus() == ReturnStatus.SELLER_APPROVED)
                .count();
        long rejected = allSellerRequests.stream()
                .filter(r -> "SELLER_REJECTED".equalsIgnoreCase(r.getSellerApprovalStatus())
                        || r.getStatus() == ReturnStatus.REJECTED
                        || r.getStatus() == ReturnStatus.SELLER_REJECTED)
                .count();
        long refunded = allSellerRequests.stream()
                .filter(r -> r.getStatus() == ReturnStatus.COMPLETED)
                .count();

        var stream = allSellerRequests.stream();
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            String sFilter = status.trim().toUpperCase();
            stream = stream.filter(r -> {
                String reqStatus = r.getStatus().name();
                String appStatus = r.getSellerApprovalStatus() != null ? r.getSellerApprovalStatus().toUpperCase() : "";
                if ("PENDING".equals(sFilter) || "PENDING_SELLER_APPROVAL".equals(sFilter)) {
                    return "PENDING_SELLER_APPROVAL".equals(appStatus) || "REQUESTED".equals(reqStatus);
                }
                if ("APPROVED".equals(sFilter) || "SELLER_APPROVED".equals(sFilter)) {
                    return "SELLER_APPROVED".equals(appStatus) || "APPROVED".equals(reqStatus) || "COMPLETED".equals(reqStatus);
                }
                if ("REJECTED".equals(sFilter) || "SELLER_REJECTED".equals(sFilter)) {
                    return "SELLER_REJECTED".equals(appStatus) || "REJECTED".equals(reqStatus);
                }
                if ("COMPLETED".equals(sFilter) || "REFUNDED".equals(sFilter)) {
                    return "COMPLETED".equals(reqStatus);
                }
                return reqStatus.equalsIgnoreCase(sFilter) || appStatus.equalsIgnoreCase(sFilter);
            });
        }

        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            stream = stream.filter(r ->
                    (r.getOrder() != null && r.getOrder().getId().toString().contains(q)) ||
                    (r.getOrder() != null && r.getOrder().getOrderReference() != null && r.getOrder().getOrderReference().toLowerCase().contains(q)) ||
                    (r.getCustomer() != null && r.getCustomer().getFullName().toLowerCase().contains(q)) ||
                    (r.getReason() != null && r.getReason().toLowerCase().contains(q))
            );
        }

        List<ReturnResponse> list = stream.map(r -> {
            Optional<Refund> ref = refundRepository.findByReturnRequestId(r.getId());
            return ReturnResponse.from(r, ref.orElse(null), paymentGatewayService.getMode());
        }).toList();

        return new SellerRefundSummaryDto(total, pending, approved, rejected, refunded, list);
    }

    @Override
    @Transactional(readOnly = true)
    public SellerRefundSummaryDto getAdminRefunds(String status, String search) {
        List<ReturnRequest> allRequests = returnRequestRepository.findAllWithDetails();

        long total = allRequests.size();
        long pending = allRequests.stream()
                .filter(r -> "PENDING_SELLER_APPROVAL".equalsIgnoreCase(r.getSellerApprovalStatus())
                        || r.getStatus() == ReturnStatus.REQUESTED
                        || r.getStatus() == ReturnStatus.PENDING_SELLER_APPROVAL)
                .count();
        long approved = allRequests.stream()
                .filter(r -> "SELLER_APPROVED".equalsIgnoreCase(r.getSellerApprovalStatus())
                        || r.getStatus() == ReturnStatus.APPROVED
                        || r.getStatus() == ReturnStatus.SELLER_APPROVED)
                .count();
        long rejected = allRequests.stream()
                .filter(r -> "SELLER_REJECTED".equalsIgnoreCase(r.getSellerApprovalStatus())
                        || r.getStatus() == ReturnStatus.REJECTED
                        || r.getStatus() == ReturnStatus.SELLER_REJECTED)
                .count();
        long refunded = allRequests.stream()
                .filter(r -> r.getStatus() == ReturnStatus.COMPLETED)
                .count();

        var stream = allRequests.stream();
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            String sFilter = status.trim().toUpperCase();
            stream = stream.filter(r -> {
                String reqStatus = r.getStatus().name();
                String appStatus = r.getSellerApprovalStatus() != null ? r.getSellerApprovalStatus().toUpperCase() : "";
                if ("PENDING".equals(sFilter) || "PENDING_SELLER_APPROVAL".equals(sFilter)) {
                    return "PENDING_SELLER_APPROVAL".equals(appStatus) || "REQUESTED".equals(reqStatus);
                }
                if ("APPROVED".equals(sFilter) || "SELLER_APPROVED".equals(sFilter)) {
                    return "SELLER_APPROVED".equals(appStatus) || "APPROVED".equals(reqStatus) || "COMPLETED".equals(reqStatus);
                }
                if ("REJECTED".equals(sFilter) || "SELLER_REJECTED".equals(sFilter)) {
                    return "SELLER_REJECTED".equals(appStatus) || "REJECTED".equals(reqStatus);
                }
                if ("COMPLETED".equals(sFilter) || "REFUNDED".equals(sFilter)) {
                    return "COMPLETED".equals(reqStatus);
                }
                return reqStatus.equalsIgnoreCase(sFilter) || appStatus.equalsIgnoreCase(sFilter);
            });
        }

        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            stream = stream.filter(r ->
                    (r.getOrder() != null && r.getOrder().getId().toString().contains(q)) ||
                    (r.getOrder() != null && r.getOrder().getOrderReference() != null && r.getOrder().getOrderReference().toLowerCase().contains(q)) ||
                    (r.getCustomer() != null && r.getCustomer().getFullName().toLowerCase().contains(q)) ||
                    (r.getReason() != null && r.getReason().toLowerCase().contains(q))
            );
        }

        List<ReturnResponse> list = stream.map(r -> {
            Optional<Refund> ref = refundRepository.findByReturnRequestId(r.getId());
            return ReturnResponse.from(r, ref.orElse(null), paymentGatewayService.getMode());
        }).toList();

        return new SellerRefundSummaryDto(total, pending, approved, rejected, refunded, list);
    }

    @Override
    public ReturnResponse processSandboxApproval(Long returnId, User customer) {
        return processAdminApproval(returnId, customer);
    }

    @Override
    @Transactional
    public ReturnResponse processAdminApproval(Long returnId, User customer) {
        ReturnRequest returnRequest = returnRequestRepository.findByIdForUpdate(returnId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Return request not found"));

        if (!returnRequest.getCustomer().getId().equals(customer.getId()) && customer.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this return request");
        }

        if (returnRequest.getStatus() == ReturnStatus.REJECTED || "SELLER_REJECTED".equals(returnRequest.getSellerApprovalStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot approve a rejected return request");
        }

        Optional<Refund> existingRefund = refundRepository.findByReturnRequestId(returnId);
        if (returnRequest.getStatus() == ReturnStatus.COMPLETED && existingRefund.isPresent() && existingRefund.get().getRefundStatus() == RefundStatus.REFUNDED) {
            return ReturnResponse.from(returnRequest, existingRefund.get(), paymentGatewayService.getMode());
        }

        if (existingRefund.isPresent()) {
            Refund r = existingRefund.get();
            if (r.getRefundStatus() == RefundStatus.REFUNDED || r.getRefundStatus() == RefundStatus.REFUND_PROCESSING) {
                return ReturnResponse.from(returnRequest, r, paymentGatewayService.getMode());
            }
        }

        Instant now = Instant.now();
        returnRequest.setStatus(ReturnStatus.APPROVED);
        returnRequest.setApprovedAt(now);
        returnRequest.setSellerApprovalStatus("SELLER_APPROVED");
        returnRequest.setSellerApprovedAt(now);

        return executePlatformRefund(returnRequest, existingRefund.orElse(null), now);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReturnResponse> getMyReturns(User customer) {
        List<ReturnRequest> list = returnRequestRepository.findByCustomerIdWithDetails(customer.getId());
        return list.stream().map(r -> {
            Optional<Refund> ref = refundRepository.findByReturnRequestId(r.getId());
            return ReturnResponse.from(r, ref.orElse(null), paymentGatewayService.getMode());
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponse> getMyRefunds(User customer) {
        List<Refund> list = refundRepository.findByCustomerIdWithDetails(customer.getId());
        return list.stream().map(RefundResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnResponse getReturnById(Long id, User customer) {
        ReturnRequest req = returnRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Return request not found"));

        if (!req.getCustomer().getId().equals(customer.getId()) && customer.getRole() != User.Role.ADMIN &&
            (req.getSeller() == null || !req.getSeller().getId().equals(customer.getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this return request");
        }

        Optional<Refund> ref = refundRepository.findByReturnRequestId(req.getId());
        return ReturnResponse.from(req, ref.orElse(null), paymentGatewayService.getMode());
    }

    @Override
    public ReturnResponse cancelReturn(Long id, User customer) {
        ReturnRequest req = returnRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Return request not found"));

        if (!req.getCustomer().getId().equals(customer.getId()) && customer.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this return request");
        }

        if (req.getStatus() != ReturnStatus.REQUESTED && req.getStatus() != ReturnStatus.PENDING_SELLER_APPROVAL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Cannot cancel return request in '%s' status.", req.getStatus()));
        }

        req.setStatus(ReturnStatus.CANCELLED);
        ReturnRequest updated = returnRequestRepository.save(req);

        log.info("Return request cancelled by customer: returnId={}, customerId={}", id, customer.getId());

        return ReturnResponse.from(updated, null, paymentGatewayService.getMode());
    }
}
