package com.securecommerce.platform.wishlist.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.wishlist.dto.WishlistResponse;
import com.securecommerce.platform.wishlist.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * WishlistController — All endpoints require CUSTOMER role.
 *
 * GET  /api/wishlist                                → get wishlist
 * POST /api/wishlist/items?productId=               → add item (idempotent)
 * DELETE /api/wishlist/items/{itemId}               → remove item
 * POST /api/wishlist/items/{itemId}/move-to-cart    → move to cart
 */
@RestController
@RequestMapping("/wishlist")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<ApiResponse<WishlistResponse>> getWishlist(
            @AuthenticationPrincipal User currentUser) {
        WishlistResponse wishlist = wishlistService.getWishlist(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Wishlist retrieved", wishlist));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<WishlistResponse>> addItem(
            @RequestParam Long productId,
            @AuthenticationPrincipal User currentUser) {
        WishlistResponse wishlist = wishlistService.addItem(currentUser.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Item added to wishlist", wishlist));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<WishlistResponse>> removeItem(
            @PathVariable Long itemId,
            @AuthenticationPrincipal User currentUser) {
        WishlistResponse wishlist = wishlistService.removeItem(currentUser.getId(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from wishlist", wishlist));
    }

    @PostMapping("/items/{itemId}/move-to-cart")
    public ResponseEntity<ApiResponse<WishlistResponse>> moveToCart(
            @PathVariable Long itemId,
            @AuthenticationPrincipal User currentUser) {
        WishlistResponse wishlist = wishlistService.moveToCart(currentUser.getId(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Item moved to cart", wishlist));
    }
}
