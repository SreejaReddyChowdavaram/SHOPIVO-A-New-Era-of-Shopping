package com.securecommerce.platform.cart.service;

import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.dto.CartResponse;

public interface CartService {

    /** Get or create an empty cart for the user */
    CartResponse getCart(Long userId);

    /** Add an item; increment quantity if product already in cart */
    CartResponse addItem(Long userId, CartItemRequest request);

    /** Update quantity of an existing item */
    CartResponse updateQuantity(Long userId, Long itemId, int quantity);

    /** Remove a single item from the cart */
    CartResponse removeItem(Long userId, Long itemId);

    /** Remove all items (called internally after checkout) */
    void clearCart(Long userId);
}
