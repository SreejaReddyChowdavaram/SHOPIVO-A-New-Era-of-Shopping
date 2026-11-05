package com.securecommerce.platform.cart.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * CartItemRequest — sent by the client when adding or updating a cart item.
 */
public record CartItemRequest(
        @NotNull(message = "Product ID is required")
        Long productId,

        @Positive(message = "Quantity must be at least 1")
        int quantity
) {}
