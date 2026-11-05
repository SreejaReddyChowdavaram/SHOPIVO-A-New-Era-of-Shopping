package com.securecommerce.platform.order.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.order.dto.OrderResponse;
import com.securecommerce.platform.order.dto.OrderStatusUpdateRequest;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SellerOrderController — Dedicated endpoints for seller order and fulfillment management.
 * Base path: /seller/orders
 */
@RestController
@RequestMapping("/seller/orders")
@RequiredArgsConstructor
public class SellerOrderController {

    private final OrderService orderService;

    /**
     * Seller views all orders containing products belonging to them.
     */
    @GetMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getSellerOrders(
            @AuthenticationPrincipal User currentUser) {
        List<OrderResponse> orders = orderService.getSellerOrders(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Seller orders retrieved", orders));
    }

    /**
     * Seller views an order scoped to only their line items.
     * Enforces ownership: returns 403 Forbidden if the authenticated seller has no items in the order.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<OrderResponse>> getSellerOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        OrderResponse order = orderService.getOrderById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Seller order details retrieved", order));
    }

    /**
     * Seller advances fulfillment status for their order (e.g. CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED).
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        OrderResponse order = orderService.updateStatus(id, request.status(), currentUser);
        return ResponseEntity.ok(ApiResponse.success("Order status updated", order));
    }
}
