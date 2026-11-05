package com.securecommerce.platform.cart.controller;

import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.dto.CartResponse;
import com.securecommerce.platform.cart.service.CartService;
import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * CartController — All cart endpoints require CUSTOMER role.
 *
 * GET    /api/cart                     → get current cart
 * POST   /api/cart/items               → add item
 * PUT    /api/cart/items/{itemId}      → update quantity
 * DELETE /api/cart/items/{itemId}      → remove item
 * DELETE /api/cart                     → clear entire cart
 */
@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @AuthenticationPrincipal User currentUser) {
        CartResponse cart = cartService.getCart(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Cart retrieved", cart));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @Valid @RequestBody CartItemRequest request,
            @AuthenticationPrincipal User currentUser) {
        CartResponse cart = cartService.addItem(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", cart));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateQuantity(
            @PathVariable Long itemId,
            @RequestParam int quantity,
            @AuthenticationPrincipal User currentUser) {

        if (quantity <= 0) {
            // Treat quantity ≤ 0 as "remove item"
            CartResponse cart = cartService.removeItem(currentUser.getId(), itemId);
            return ResponseEntity.ok(ApiResponse.success("Item removed from cart", cart));
        }

        CartResponse cart = cartService.updateQuantity(currentUser.getId(), itemId, quantity);
        return ResponseEntity.ok(ApiResponse.success("Cart updated", cart));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @PathVariable Long itemId,
            @AuthenticationPrincipal User currentUser) {
        CartResponse cart = cartService.removeItem(currentUser.getId(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Item removed", cart));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @AuthenticationPrincipal User currentUser) {
        cartService.clearCart(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Cart cleared", null));
    }
}
