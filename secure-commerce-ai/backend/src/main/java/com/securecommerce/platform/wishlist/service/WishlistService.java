package com.securecommerce.platform.wishlist.service;

import com.securecommerce.platform.wishlist.dto.WishlistResponse;

public interface WishlistService {

    WishlistResponse getWishlist(Long userId);

    /** Idempotent — adding a product already in the wishlist is a no-op */
    WishlistResponse addItem(Long userId, Long productId);

    WishlistResponse removeItem(Long userId, Long itemId);

    /** Moves the item to cart (via CartService) then removes from wishlist */
    WishlistResponse moveToCart(Long userId, Long itemId);
}
