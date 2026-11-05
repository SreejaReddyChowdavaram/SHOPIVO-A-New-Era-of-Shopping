package com.securecommerce.platform.order.service;

import com.securecommerce.platform.order.dto.*;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import com.securecommerce.platform.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OrderService {

    OrderResponse placeOrder(Long customerId, OrderRequest request);

    void recordCheckoutStarted(Long customerId);

    List<OrderResponse> getMyOrders(Long customerId);

    OrderResponse getOrderById(Long orderId, User requester);

    List<OrderResponse> getSellerOrders(Long sellerId);

    List<OrderResponse> getAllOrders(OrderStatus status);

    OrderResponse updateStatus(Long orderId, OrderStatus newStatus, User requester);

    OrderResponse cancelOrder(Long orderId, String reason, User requester);

    Page<AdminOrderListItemResponse> getAdminOrdersPaged(OrderStatus status, PaymentStatus paymentStatus, String search, Pageable pageable);

    AdminOrderDetailResponse getAdminOrderDetail(Long orderId);

    AdminOrderSummaryMetricsResponse getAdminOrderMetrics();
}
