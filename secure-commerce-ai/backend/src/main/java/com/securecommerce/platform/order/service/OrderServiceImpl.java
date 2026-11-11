package com.securecommerce.platform.order.service;

import com.securecommerce.platform.address.entity.Address;
import com.securecommerce.platform.address.repository.AddressRepository;
import com.securecommerce.platform.cart.entity.Cart;
import com.securecommerce.platform.cart.entity.CartItem;
import com.securecommerce.platform.cart.repository.CartItemRepository;
import com.securecommerce.platform.cart.repository.CartRepository;
import com.securecommerce.platform.notification.entity.NotificationType;
import com.securecommerce.platform.notification.service.NotificationService;
import com.securecommerce.platform.order.dto.OrderRequest;
import com.securecommerce.platform.order.dto.OrderResponse;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderItem;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderItemRepository;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import com.securecommerce.platform.order.dto.AdminOrderDetailResponse;
import com.securecommerce.platform.order.dto.AdminOrderListItemResponse;
import com.securecommerce.platform.order.dto.AdminOrderSummaryMetricsResponse;
import com.securecommerce.platform.order.dto.OrderRequest;
import com.securecommerce.platform.order.dto.OrderResponse;
import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentMethod;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.returns.entity.Refund;
import com.securecommerce.platform.returns.entity.ReturnRequest;
import com.securecommerce.platform.returns.repository.RefundRepository;
import com.securecommerce.platform.returns.repository.ReturnRequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.service.EventLoggingService;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final com.securecommerce.platform.coupon.service.CouponService couponService;

    private static final String REFERENCE_ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final java.security.SecureRandom SECURE_RANDOM = new java.security.SecureRandom();

    private String generateUniqueOrderReference() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder("SHV-");
            for (int i = 0; i < 8; i++) {
                sb.append(REFERENCE_ALPHANUMERIC.charAt(SECURE_RANDOM.nextInt(REFERENCE_ALPHANUMERIC.length())));
            }
            String candidate = sb.toString();
            if (!orderRepository.existsByOrderReference(candidate)) {
                return candidate;
            }
        }
        return "SHV-" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
    private final PaymentRepository paymentRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final RefundRepository refundRepository;
    private final EventLoggingService eventLoggingService;

    @Override
    public OrderResponse placeOrder(Long customerId, OrderRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        // 1. Fetch customer cart and reject if empty
        Cart cart = cartRepository.findByUserId(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot place order with an empty cart"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot place order with an empty cart");
        }

        // 2. Validate chosen shipping address
        Address address = addressRepository.findByIdAndUserId(request.addressId(), customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid shipping address"));

        // 3. Create Order entity with snapshot address
        String orderReference = generateUniqueOrderReference();
        Order order = Order.builder()
                .customer(customer)
                .orderReference(orderReference)
                .shippingFullName(address.getFullName())
                .shippingPhone(address.getPhone())
                .shippingLine1(address.getLine1())
                .shippingLine2(address.getLine2())
                .shippingCity(address.getCity())
                .shippingState(address.getState())
                .shippingPostalCode(address.getPostalCode())
                .shippingCountry(address.getCountry())
                .status(OrderStatus.PENDING)
                .paymentExpiresAt(java.time.Instant.now().plus(10, java.time.temporal.ChronoUnit.MINUTES))
                .subtotalAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        BigDecimal subtotalAmount = BigDecimal.ZERO;

        // 4. Process each cart item: re-validate stock, decrement stock atomically, snapshot product data
        for (CartItem cartItem : cart.getItems()) {
            Product product = productRepository.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + cartItem.getProduct().getId()));

            if (product.getStatus() != Product.Status.APPROVED) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        String.format("Product '%s' is no longer available for purchase", product.getName()));
            }

            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        String.format("Insufficient stock for '%s'. Available: %d, Requested: %d",
                                product.getName(), product.getStockQuantity(), cartItem.getQuantity()));
            }

            // Atomic stock decrement
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            // Re-read current product price for the immutable snapshot (do not rely on cart snapshot alone)
            BigDecimal itemPrice = product.getPrice();
            BigDecimal lineTotal = itemPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            subtotalAmount = subtotalAmount.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .seller(product.getSeller())
                    .productNameSnapshot(product.getName())
                    .priceSnapshot(itemPrice)
                    .quantity(cartItem.getQuantity())
                    .lineTotal(lineTotal)
                    .build();

            order.getItems().add(orderItem);
        }

        // 5. Authoritative Coupon Validation & Discount Calculation
        BigDecimal discountAmount = BigDecimal.ZERO;
        String normalizedCouponCode = null;
        if (request.couponCode() != null && !request.couponCode().trim().isEmpty()) {
            normalizedCouponCode = request.couponCode().trim().toUpperCase();
            discountAmount = couponService.calculateAuthoritativeDiscount(normalizedCouponCode, subtotalAmount, customerId);
        }

        BigDecimal finalTotalAmount = subtotalAmount.subtract(discountAmount).max(BigDecimal.ZERO);

        order.setSubtotalAmount(subtotalAmount);
        order.setDiscountAmount(discountAmount);
        order.setCouponCode(normalizedCouponCode);
        order.setTotalAmount(finalTotalAmount);

        Order savedOrder = orderRepository.save(order);

        // Record coupon usage if discount was applied
        if (normalizedCouponCode != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            couponService.recordCouponUsage(normalizedCouponCode, savedOrder, customer, discountAmount);
        }

        // 6. Clear customer's cart
        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        cartRepository.save(cart);

        log.info("Order placed successfully: orderId={}, customerId={}, subtotal={}, discount={}, coupon={}, totalAmount={}",
                savedOrder.getId(), customerId, savedOrder.getSubtotalAmount(), savedOrder.getDiscountAmount(),
                savedOrder.getCouponCode(), savedOrder.getTotalAmount());

        // Emit ORDER_PLACED notification for customer
        try {
            notificationService.createNotification(
                    savedOrder.getCustomer(),
                    NotificationType.ORDER_PLACED,
                    "Order Placed Successfully",
                    String.format("Your order #%d for ₹%s has been placed successfully.", savedOrder.getId(), savedOrder.getTotalAmount()),
                    "ORDER",
                    savedOrder.getId()
            );
        } catch (Exception e) {
            log.error("Failed to generate ORDER_PLACED notification for order #{}: {}", savedOrder.getId(), e.getMessage());
        }

        // Emit ORDER_PLACED notifications for all distinct sellers who have items in this order
        try {
            savedOrder.getItems().stream()
                    .map(OrderItem::getSeller)
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .forEach(seller -> {
                        try {
                            notificationService.createNotification(
                                    seller,
                                    NotificationType.ORDER_PLACED,
                                    "New Order Received",
                                    String.format("You received a new order (#%d) containing your products.", savedOrder.getId()),
                                    "ORDER",
                                    savedOrder.getId()
                            );
                        } catch (Exception se) {
                            log.error("Failed to notify seller {} for order #{}: {}", seller.getId(), savedOrder.getId(), se.getMessage());
                        }
                    });
        } catch (Exception e) {
            log.error("Failed to process seller notifications for order #{}: {}", savedOrder.getId(), e.getMessage());
        }

        // Research Event: ORDER_PLACED
        eventLoggingService.logEvent(
                EventType.ORDER_PLACED,
                customerId,
                "ORDER",
                String.valueOf(savedOrder.getId()),
                Map.of(
                        "orderId", savedOrder.getId(),
                        "totalAmount", savedOrder.getTotalAmount(),
                        "itemCount", savedOrder.getItems() != null ? savedOrder.getItems().size() : 0,
                        "shippingCity", savedOrder.getShippingCity() != null ? savedOrder.getShippingCity() : ""
                )
        );

        return OrderResponse.from(savedOrder);
    }

    @Override
    public void recordCheckoutStarted(Long customerId) {
        Cart cart = cartRepository.findByUserId(customerId).orElse(null);
        Map<String, Object> meta = new HashMap<>();
        if (cart != null) {
            meta.put("cartId", cart.getId());
            meta.put("itemCount", cart.getItems() != null ? cart.getItems().size() : 0);
        }
        eventLoggingService.logEvent(
                EventType.CHECKOUT_STARTED,
                customerId,
                "CART",
                cart != null ? String.valueOf(cart.getId()) : null,
                meta
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(Long customerId) {
        return orderRepository.findByCustomerIdWithItems(customerId)
                .stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, User requester) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (requester.getRole() == User.Role.ADMIN) {
            return OrderResponse.from(order);
        }

        if (requester.getRole() == User.Role.CUSTOMER) {
            if (!order.getCustomer().getId().equals(requester.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this order");
            }
            return OrderResponse.from(order);
        }

        if (requester.getRole() == User.Role.SELLER) {
            boolean hasItems = order.getItems().stream()
                    .anyMatch(item -> item.getSeller() != null && item.getSeller().getId().equals(requester.getId()));
            if (!hasItems) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have items in this order");
            }
            return OrderResponse.fromForSeller(order, requester.getId());
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getSellerOrders(Long sellerId) {
        return orderRepository.findOrdersForSeller(sellerId)
                .stream()
                .map(order -> OrderResponse.fromForSeller(order, sellerId))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(OrderStatus status) {
        return orderRepository.findAllWithStatusFilter(status)
                .stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Override
    public OrderResponse updateStatus(Long orderId, OrderStatus newStatus, User requester) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        OrderStatus currentStatus = order.getStatus();

        // 1. Role validation and forward transition check
        if (!currentStatus.canTransitionTo(newStatus, requester.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Cannot transition order from %s to %s", currentStatus, newStatus));
        }

        // 2. If seller, verify they have items in this order
        if (requester.getRole() == User.Role.SELLER) {
            boolean hasItems = order.getItems().stream()
                    .anyMatch(item -> item.getSeller() != null && item.getSeller().getId().equals(requester.getId()));
            if (!hasItems) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have items in this order");
            }
        }

        // 3. If cancelling, restore product stock
        if (newStatus == OrderStatus.CANCELLED && currentStatus != OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null) {
                    Product product = item.getProduct();
                    product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                    productRepository.save(product);
                }
            }
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);

        log.info("Order status updated: orderId={}, oldStatus={}, newStatus={}, updatedBy={}",
                orderId, currentStatus, newStatus, requester.getEmail());

        // Emit order status notifications for customer
        try {
            if (newStatus == OrderStatus.CONFIRMED && currentStatus != OrderStatus.CONFIRMED) {
                notificationService.createNotification(
                        updated.getCustomer(),
                        NotificationType.ORDER_CONFIRMED,
                        "Order Confirmed",
                        String.format("Your order #%d has been confirmed.", updated.getId()),
                        "ORDER",
                        updated.getId()
                );
            } else if (newStatus == OrderStatus.SHIPPED && currentStatus != OrderStatus.SHIPPED) {
                notificationService.createNotification(
                        updated.getCustomer(),
                        NotificationType.ORDER_SHIPPED,
                        "Order Shipped",
                        String.format("Your order #%d has been shipped and is on its way!", updated.getId()),
                        "ORDER",
                        updated.getId()
                );
            } else if (newStatus == OrderStatus.DELIVERED && currentStatus != OrderStatus.DELIVERED) {
                notificationService.createNotification(
                        updated.getCustomer(),
                        NotificationType.ORDER_DELIVERED,
                        "Order Delivered",
                        String.format("Your order #%d has been delivered. Enjoy your purchase!", updated.getId()),
                        "ORDER",
                        updated.getId()
                );
            } else if (newStatus == OrderStatus.CANCELLED && currentStatus != OrderStatus.CANCELLED) {
                notificationService.createNotification(
                        updated.getCustomer(),
                        NotificationType.ORDER_CANCELLED,
                        "Order Cancelled",
                        String.format("Your order #%d has been cancelled.", updated.getId()),
                        "ORDER",
                        updated.getId()
                );
            }
        } catch (Exception e) {
            log.error("Failed to generate order status notification for order #{}: {}", updated.getId(), e.getMessage());
        }

        if (requester.getRole() == User.Role.SELLER) {
            return OrderResponse.fromForSeller(updated, requester.getId());
        }
        return OrderResponse.from(updated);
    }

    @Override
    public OrderResponse cancelOrder(Long orderId, String reason, User requester) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        // 1. Verify ownership (Customer must own the order; Admin can cancel any order)
        if (requester.getRole() == User.Role.CUSTOMER && !order.getCustomer().getId().equals(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to cancel this order");
        }

        if (requester.getRole() == User.Role.SELLER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sellers cannot cancel entire customer orders");
        }

        OrderStatus currentStatus = order.getStatus();

        // 2. Check if already cancelled or terminal
        if (currentStatus == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is already cancelled");
        }

        if (currentStatus == OrderStatus.DELIVERED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot cancel a delivered order. Please request a return instead.");
        }

        if (currentStatus == OrderStatus.SHIPPED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order has already been shipped and cannot be cancelled directly.");
        }

        // 3. Customer can only cancel PENDING or CONFIRMED orders (before seller processes/ships)
        if (requester.getRole() == User.Role.CUSTOMER && currentStatus != OrderStatus.PENDING && currentStatus != OrderStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Order in %s status can no longer be cancelled directly by the customer.", currentStatus));
        }

        // 4. Atomically restore product stock (exactly once)
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        // 5. Update order state, cancellation reason and timestamp
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Cancelled by customer");
        order.setCancelledAt(java.time.Instant.now());

        Order savedOrder = orderRepository.save(order);

        log.info("Order cancelled successfully: orderId={}, cancelledBy={}, reason={}",
                orderId, requester.getEmail(), order.getCancellationReason());

        // Emit ORDER_CANCELLED notification
        try {
            notificationService.createNotification(
                    savedOrder.getCustomer(),
                    NotificationType.ORDER_CANCELLED,
                    "Order Cancelled",
                    String.format("Your order #%d has been cancelled. Reason: %s", savedOrder.getId(), savedOrder.getCancellationReason()),
                    "ORDER",
                    savedOrder.getId()
            );
        } catch (Exception e) {
            log.error("Failed to generate ORDER_CANCELLED notification for order #{}: {}", savedOrder.getId(), e.getMessage());
        }

        // Emit ORDER_CANCELLED notification to all affected sellers
        try {
            savedOrder.getItems().stream()
                    .map(OrderItem::getSeller)
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .forEach(seller -> {
                        try {
                            notificationService.createNotification(
                                    seller,
                                    NotificationType.ORDER_CANCELLED,
                                    "Order Cancelled",
                                    String.format("Order #%d was cancelled. Reserved items have been returned to your inventory.", savedOrder.getId()),
                                    "ORDER",
                                    savedOrder.getId()
                            );
                        } catch (Exception se) {
                            log.error("Failed to notify seller {} for cancelled order #{}: {}", seller.getId(), savedOrder.getId(), se.getMessage());
                        }
                    });
        } catch (Exception e) {
            log.error("Failed to process seller cancellation notifications for order #{}: {}", savedOrder.getId(), e.getMessage());
        }

        // Research Event: ORDER_CANCELLED
        eventLoggingService.logEvent(
                EventType.ORDER_CANCELLED,
                savedOrder.getCustomer().getId(),
                "ORDER",
                String.valueOf(savedOrder.getId()),
                Map.of(
                        "orderId", savedOrder.getId(),
                        "reason", savedOrder.getCancellationReason() != null ? savedOrder.getCancellationReason() : "UNSPECIFIED",
                        "cancelledBy", requester.getEmail()
                )
        );

        return OrderResponse.from(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminOrderListItemResponse> getAdminOrdersPaged(
            OrderStatus status, PaymentStatus paymentStatus, String search, Pageable pageable) {

        String trimmedSearch = search != null && !search.trim().isEmpty() ? search.trim() : null;
        String searchPattern = trimmedSearch != null ? "%" + trimmedSearch.toLowerCase() + "%" : null;

        Page<Order> orders = orderRepository.findAdminOrdersWithFilters(
                status, paymentStatus, trimmedSearch, searchPattern, pageable);

        return orders.map(order -> {
            Optional<Payment> payment = paymentRepository.findByOrderId(order.getId());
            PaymentStatus pStatus = payment.map(Payment::getPaymentStatus).orElse(null);
            PaymentMethod pMethod = payment.map(Payment::getPaymentMethod).orElse(null);

            int totalItems = order.getItems() != null
                    ? order.getItems().stream().mapToInt(OrderItem::getQuantity).sum()
                    : 0;

            int sellerCount = order.getItems() != null
                    ? (int) order.getItems().stream()
                            .map(OrderItem::getSeller)
                            .filter(java.util.Objects::nonNull)
                            .map(User::getId)
                            .distinct()
                            .count()
                    : 0;

            String customerName = order.getCustomer() != null
                    ? order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName()
                    : (order.getShippingFullName() != null ? order.getShippingFullName() : "Customer");

            String customerEmail = order.getCustomer() != null ? order.getCustomer().getEmail() : "";

            return new AdminOrderListItemResponse(
                    order.getId(),
                    order.getCustomer() != null ? order.getCustomer().getId() : null,
                    customerName,
                    customerEmail,
                    order.getCreatedAt(),
                    order.getTotalAmount(),
                    totalItems,
                    order.getStatus(),
                    pStatus,
                    pMethod,
                    sellerCount,
                    order.getCancellationReason()
            );
        });
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOrderDetailResponse getAdminOrderDetail(Long orderId) {
        Order order = orderRepository.findByIdWithAllDetails(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found with id: " + orderId));

        Long customerId = order.getCustomer() != null ? order.getCustomer().getId() : null;
        String customerName = order.getCustomer() != null
                ? order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName()
                : (order.getShippingFullName() != null ? order.getShippingFullName() : "Customer");
        String customerEmail = order.getCustomer() != null ? order.getCustomer().getEmail() : "";

        OrderResponse.ShippingAddressSnapshot shippingAddress = new OrderResponse.ShippingAddressSnapshot(
                order.getShippingFullName(),
                order.getShippingPhone(),
                order.getShippingLine1(),
                order.getShippingLine2(),
                order.getShippingCity(),
                order.getShippingState(),
                order.getShippingPostalCode(),
                order.getShippingCountry()
        );

        List<AdminOrderDetailResponse.AdminOrderItemResponse> items = new ArrayList<>();
        Map<Long, AdminOrderDetailResponse.SellerBreakdownResponse> sellerMap = new LinkedHashMap<>();
        int totalItems = 0;

        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                totalItems += item.getQuantity();

                User seller = item.getSeller();
                Long sellerId = seller != null ? seller.getId() : null;
                String sellerName = seller != null ? seller.getFirstName() + " " + seller.getLastName() : "Unknown Seller";
                String sellerEmail = seller != null ? seller.getEmail() : "";

                String imageUrl = item.getProduct() != null ? item.getProduct().getImageUrl() : null;
                Long productId = item.getProduct() != null ? item.getProduct().getId() : null;

                items.add(new AdminOrderDetailResponse.AdminOrderItemResponse(
                        item.getId(),
                        productId,
                        item.getProductNameSnapshot(),
                        imageUrl,
                        sellerId,
                        sellerName,
                        sellerEmail,
                        item.getPriceSnapshot(),
                        item.getQuantity(),
                        item.getLineTotal()
                ));

                if (sellerId != null) {
                    AdminOrderDetailResponse.SellerBreakdownResponse prev = sellerMap.get(sellerId);
                    if (prev == null) {
                        sellerMap.put(sellerId, new AdminOrderDetailResponse.SellerBreakdownResponse(
                                sellerId, sellerName, sellerEmail, item.getQuantity(), item.getLineTotal()
                        ));
                    } else {
                        sellerMap.put(sellerId, new AdminOrderDetailResponse.SellerBreakdownResponse(
                                sellerId,
                                sellerName,
                                sellerEmail,
                                prev.itemCount() + item.getQuantity(),
                                prev.subtotal().add(item.getLineTotal())
                        ));
                    }
                }
            }
        }

        BigDecimal subtotal = order.getSubtotalAmount() != null ? order.getSubtotalAmount() : order.getTotalAmount();
        BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;

        Optional<Payment> optionalPayment = paymentRepository.findByOrderId(orderId);
        AdminOrderDetailResponse.PaymentDetailResponse paymentDetail = optionalPayment.map(p ->
                new AdminOrderDetailResponse.PaymentDetailResponse(
                        p.getId(),
                        p.getPaymentStatus(),
                        p.getPaymentMethod(),
                        p.getTransactionId(),
                        p.getPaymentGateway(),
                        p.getCardLast4(),
                        p.getUpiIdSnapshot(),
                        p.getFailureReason(),
                        p.getCreatedAt()
                )
        ).orElse(null);

        List<ReturnRequest> returnRequests = returnRequestRepository.findByOrderIdWithDetails(orderId);
        List<AdminOrderDetailResponse.ReturnSnapshotResponse> returns = returnRequests.stream().map(r ->
                new AdminOrderDetailResponse.ReturnSnapshotResponse(
                        r.getId(),
                        r.getOrderItem() != null ? r.getOrderItem().getId() : null,
                        r.getReason(),
                        r.getReturnNote(),
                        r.getStatus(),
                        r.getRefundAmount(),
                        r.getRequestedAt(),
                        r.getCompletedAt()
                )
        ).toList();

        Optional<Refund> optionalRefund = refundRepository.findByOrderId(orderId);
        List<AdminOrderDetailResponse.RefundSnapshotResponse> refunds = optionalRefund.stream().map(ref ->
                new AdminOrderDetailResponse.RefundSnapshotResponse(
                        ref.getId(),
                        ref.getRefundStatus(),
                        ref.getRefundAmount(),
                        ref.getRefundTransactionId(),
                        ref.getPaymentMethod(),
                        ref.getProcessedAt()
                )
        ).toList();

        return new AdminOrderDetailResponse(
                order.getId(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                order.getCancellationReason(),
                order.getCancelledAt(),
                customerId,
                customerName,
                customerEmail,
                shippingAddress,
                subtotal,
                discount,
                order.getCouponCode(),
                order.getTotalAmount(),
                totalItems,
                items,
                new ArrayList<>(sellerMap.values()),
                paymentDetail,
                returns,
                refunds
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOrderSummaryMetricsResponse getAdminOrderMetrics() {
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        long processingOrders = orderRepository.countByStatus(OrderStatus.PROCESSING);
        long shippedOrders = orderRepository.countByStatus(OrderStatus.SHIPPED);
        long deliveredOrders = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);
        BigDecimal totalOrderValue = orderRepository.sumTotalOrderValue();

        return new AdminOrderSummaryMetricsResponse(
                totalOrders,
                pendingOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders,
                totalOrderValue != null ? totalOrderValue : BigDecimal.ZERO
        );
    }
}
