package com.securecommerce.platform.cart.service;

import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.dto.CartResponse;
import com.securecommerce.platform.cart.entity.Cart;
import com.securecommerce.platform.cart.entity.CartItem;
import com.securecommerce.platform.cart.repository.CartItemRepository;
import com.securecommerce.platform.cart.repository.CartRepository;
import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.service.EventLoggingService;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * CartServiceImpl — Business logic for cart operations.
 *
 * KEY RULES:
 *   1. getCart() creates an empty cart if none exists (lazy creation).
 *   2. addItem() increments quantity if the product is already in the cart.
 *   3. addItem() and updateQuantity() reject if requested qty > stockQuantity.
 *   4. addItem() rejects if the product status is not APPROVED.
 *   5. Ownership is checked for updateQuantity/removeItem — ensures a customer
 *      can only modify their own cart.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final EventLoggingService eventLoggingService;

    // ─── getCart ─────────────────────────────────────────────

    @Override
    public CartResponse getCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyCart(userId));
        return CartResponse.from(cart);
    }

    // ─── addItem ─────────────────────────────────────────────

    @Override
    public CartResponse addItem(Long userId, CartItemRequest request) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyCart(userId));

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found"));

        // Only APPROVED products can be added
        if (product.getStatus() != Product.Status.APPROVED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Product is not available for purchase");
        }

        // Stock check
        validateStock(product, request.quantity());

        // Increment if product already in cart, otherwise create new item
        cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
                .ifPresentOrElse(
                        existingItem -> {
                            int newQty = existingItem.getQuantity() + request.quantity();
                            validateStock(product, newQty);
                            existingItem.setQuantity(newQty);
                            cartItemRepository.save(existingItem);
                        },
                        () -> {
                            CartItem newItem = CartItem.builder()
                                    .cart(cart)
                                    .product(product)
                                    .quantity(request.quantity())
                                    .priceAtAddition(product.getPrice())  // snapshot
                                    .build();
                            cart.getItems().add(newItem);
                            cartItemRepository.save(newItem);
                        }
                );

        // Reload with fresh JOIN FETCH to build accurate response
        Cart refreshed = cartRepository.findByUserId(userId).orElseThrow();

        eventLoggingService.logEvent(
                EventType.CART_ITEM_ADDED,
                userId,
                "CART_ITEM",
                String.valueOf(product.getId()),
                Map.of("cartId", cart.getId(), "productId", product.getId(), "quantity", request.quantity())
        );

        return CartResponse.from(refreshed);
    }

    // ─── updateQuantity ───────────────────────────────────────

    @Override
    public CartResponse updateQuantity(Long userId, Long itemId, int quantity) {
        CartItem item = getOwnedCartItem(userId, itemId);

        validateStock(item.getProduct(), quantity);
        item.setQuantity(quantity);
        cartItemRepository.save(item);

        eventLoggingService.logEvent(
                EventType.CART_ITEM_UPDATED,
                userId,
                "CART_ITEM",
                String.valueOf(itemId),
                Map.of("cartId", item.getCart().getId(), "cartItemId", itemId, "newQuantity", quantity)
        );

        Cart refreshed = cartRepository.findByUserId(userId).orElseThrow();
        return CartResponse.from(refreshed);
    }

    // ─── removeItem ───────────────────────────────────────────

    @Override
    public CartResponse removeItem(Long userId, Long itemId) {
        CartItem item = getOwnedCartItem(userId, itemId);
        Cart cart = item.getCart();
        Long productId = item.getProduct() != null ? item.getProduct().getId() : null;

        cart.getItems().remove(item);
        cartItemRepository.delete(item);

        eventLoggingService.logEvent(
                EventType.CART_ITEM_REMOVED,
                userId,
                "CART_ITEM",
                String.valueOf(itemId),
                Map.of("cartId", cart.getId(), "cartItemId", itemId, "productId", productId != null ? productId : 0)
        );

        Cart refreshed = cartRepository.findByUserId(userId).orElseThrow();
        return CartResponse.from(refreshed);
    }

    // ─── clearCart ────────────────────────────────────────────

    @Override
    public void clearCart(Long userId) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cart.getItems().clear();
            cartRepository.save(cart);
        });
    }

    // ─── Private Helpers ─────────────────────────────────────

    private Cart createEmptyCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
        Cart cart = Cart.builder().user(user).build();
        return cartRepository.save(cart);
    }

    /**
     * Fetches a cart item and verifies it belongs to the given user.
     * Prevents one customer from modifying another's cart.
     */
    private CartItem getOwnedCartItem(Long userId, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Cart item not found"));

        if (!item.getCart().getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not own this cart item");
        }
        return item;
    }

    private void validateStock(Product product, int requestedQty) {
        if (requestedQty > product.getStockQuantity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Requested quantity (%d) exceeds available stock (%d)",
                            requestedQty, product.getStockQuantity()));
        }
    }
}
