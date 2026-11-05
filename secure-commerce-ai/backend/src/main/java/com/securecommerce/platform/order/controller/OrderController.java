package com.securecommerce.platform.order.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.order.dto.OrderRequest;
import com.securecommerce.platform.order.dto.OrderResponse;
import com.securecommerce.platform.order.dto.OrderStatusUpdateRequest;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.service.InvoiceService;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * OrderController — Endpoints for checkout, order placement, and lifecycle management.
 */
@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final InvoiceService invoiceService;

    /**
     * Customer places an order from their current cart.
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @Valid @RequestBody OrderRequest request,
            @AuthenticationPrincipal User currentUser) {
        OrderResponse order = orderService.placeOrder(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order placed successfully", order));
    }

    /**
     * Customer enters checkout sequence.
     * Records CHECKOUT_STARTED event.
     */
    @PostMapping("/checkout-start")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> startCheckout(@AuthenticationPrincipal User currentUser) {
        orderService.recordCheckoutStarted(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Checkout started recorded", null));
    }

    /**
     * Customer views their own order history.
     */
    @GetMapping("/mine")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal User currentUser) {
        List<OrderResponse> orders = orderService.getMyOrders(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved", orders));
    }

    /**
     * Seller views orders that contain their products.
     *
     * @deprecated Use {@link SellerOrderController#getSellerOrders} at {@code /api/seller/orders} as the canonical modular endpoint.
     *             Maintained strictly for backwards-compatibility.
     */
    @Deprecated
    @GetMapping("/seller")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getSellerOrders(
            @AuthenticationPrincipal User currentUser) {
        List<OrderResponse> orders = orderService.getSellerOrders(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Seller orders retrieved", orders));
    }

    /**
     * Admin views all orders across the platform (optionally filtered by status).
     *
     * @deprecated Use {@link AdminOrderController#getAdminOrders} at {@code /api/admin/orders} as the canonical modular endpoint.
     *             Maintained strictly for backwards-compatibility.
     */
    @Deprecated
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAdminOrders(
            @RequestParam(required = false) OrderStatus status) {
        List<OrderResponse> orders = orderService.getAllOrders(status);
        return ResponseEntity.ok(ApiResponse.success("Admin orders retrieved", orders));
    }

    /**
     * Role-aware order lookup:
     * - Customer can view their own order
     * - Seller can view if it contains their items
     * - Admin can view any order
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        OrderResponse order = orderService.getOrderById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved", order));
    }

    /**
     * Update order status:
     * - Seller can advance orders forward
     * - Admin can advance or cancel orders
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        OrderResponse order = orderService.updateStatus(id, request.status(), currentUser);
        return ResponseEntity.ok(ApiResponse.success("Order status updated", order));
    }

    /**
     * Cancel order (Customer owns order and order is PENDING/CONFIRMED, or Admin).
     */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) com.securecommerce.platform.order.dto.CancelOrderRequest request,
            @AuthenticationPrincipal User currentUser) {
        String reason = request != null ? request.reason() : null;
        OrderResponse order = orderService.cancelOrder(id, reason, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", order));
    }

    /**
     * Download customer purchase invoice as a PDF stream.
     */
    @GetMapping("/{id}/invoice")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadInvoice(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        byte[] pdfBytes = invoiceService.generateInvoicePdf(id, currentUser);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(String.format("Invoice-INV-%06d.pdf", id))
                .build());
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
