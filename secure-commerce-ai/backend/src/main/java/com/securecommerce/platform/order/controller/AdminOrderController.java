package com.securecommerce.platform.order.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.order.dto.*;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * AdminOrderController — Administrator platform operations and oversight over orders.
 * Scoped strictly to ADMIN role. Admin identity is extracted exclusively via @AuthenticationPrincipal.
 * Base path: /admin/orders (mapped under /api/admin/orders)
 */
@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    /**
     * GET /api/admin/orders
     * Paged order search with status and payment status filters.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminOrderListItemResponse>>> getAdminOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        int pageSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<AdminOrderListItemResponse> pagedOrders =
                orderService.getAdminOrdersPaged(status, paymentStatus, search, pageable);

        return ResponseEntity.ok(ApiResponse.success("Admin orders retrieved", pagedOrders));
    }

    /**
     * GET /api/admin/orders/{id}
     * Complete platform view of an order (customer, items, mixed sellers, payments, refunds).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminOrderDetailResponse>> getAdminOrderDetail(@PathVariable Long id) {
        AdminOrderDetailResponse detail = orderService.getAdminOrderDetail(id);
        return ResponseEntity.ok(ApiResponse.success("Admin order detail retrieved", detail));
    }

    /**
     * PATCH /api/admin/orders/{id}/status
     * Admin advances or transitions fulfillment status.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        OrderResponse updated = orderService.updateStatus(id, request.status(), currentUser);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", updated));
    }

    /**
     * PATCH /api/admin/orders/{id}/cancel
     * Admin cancels an order with a reason.
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CancelOrderRequest request,
            @AuthenticationPrincipal User currentUser) {
        String reason = request != null ? request.reason() : null;
        OrderResponse cancelled = orderService.cancelOrder(id, reason, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", cancelled));
    }

    /**
     * GET /api/admin/orders/metrics
     * Operational platform metrics for Admin Dashboard monitoring.
     */
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<AdminOrderSummaryMetricsResponse>> getOrderMetrics() {
        AdminOrderSummaryMetricsResponse metrics = orderService.getAdminOrderMetrics();
        return ResponseEntity.ok(ApiResponse.success("Admin order metrics retrieved", metrics));
    }
}
