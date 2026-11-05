package com.securecommerce.platform.cart.dto;

import com.securecommerce.platform.cart.entity.Cart;
import com.securecommerce.platform.cart.entity.CartItem;
import com.securecommerce.platform.product.dto.ProductResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * CartResponse — the full cart sent to the client.
 *
 * Each item includes a nested ProductResponse summary so the frontend
 * doesn't need a second API call for product details.
 *
 * lineTotal = priceAtAddition × quantity (computed here, not stored in DB)
 * subtotal  = sum of all lineTotals
 */
public record CartResponse(
        Long cartId,
        List<CartItemResponse> items,
        BigDecimal subtotal,
        int totalItems,
        Instant updatedAt
) {

    public record CartItemResponse(
            Long itemId,
            ProductResponse product,
            int quantity,
            BigDecimal priceAtAddition,
            BigDecimal lineTotal,
            Instant addedAt
    ) {
        public static CartItemResponse from(CartItem item) {
            BigDecimal lineTotal = item.getPriceAtAddition()
                    .multiply(BigDecimal.valueOf(item.getQuantity()));
            return new CartItemResponse(
                    item.getId(),
                    ProductResponse.from(item.getProduct()),
                    item.getQuantity(),
                    item.getPriceAtAddition(),
                    lineTotal,
                    item.getAddedAt()
            );
        }
    }

    public static CartResponse from(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(CartItemResponse::from)
                .toList();

        BigDecimal subtotal = itemResponses.stream()
                .map(CartItemResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = itemResponses.stream()
                .mapToInt(CartItemResponse::quantity)
                .sum();

        return new CartResponse(
                cart.getId(),
                itemResponses,
                subtotal,
                totalItems,
                cart.getUpdatedAt()
        );
    }
}
