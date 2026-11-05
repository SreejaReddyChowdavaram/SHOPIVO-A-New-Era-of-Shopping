package com.securecommerce.platform.wishlist.service;

import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.service.CartService;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import com.securecommerce.platform.wishlist.dto.WishlistResponse;
import com.securecommerce.platform.wishlist.entity.Wishlist;
import com.securecommerce.platform.wishlist.entity.WishlistItem;
import com.securecommerce.platform.wishlist.repository.WishlistItemRepository;
import com.securecommerce.platform.wishlist.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartService cartService;

    @Override
    public WishlistResponse getWishlist(Long userId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyWishlist(userId));
        return WishlistResponse.from(wishlist);
    }

    @Override
    public WishlistResponse addItem(Long userId, Long productId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyWishlist(userId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found"));

        // Idempotent — if already in wishlist, do nothing
        boolean alreadyInWishlist = wishlistItemRepository
                .findByWishlistIdAndProductId(wishlist.getId(), productId)
                .isPresent();

        if (!alreadyInWishlist) {
            WishlistItem newItem = WishlistItem.builder()
                    .wishlist(wishlist)
                    .product(product)
                    .build();
            wishlist.getItems().add(newItem);
            wishlistItemRepository.save(newItem);
        }

        Wishlist refreshed = wishlistRepository.findByUserId(userId).orElseThrow();
        return WishlistResponse.from(refreshed);
    }

    @Override
    public WishlistResponse removeItem(Long userId, Long itemId) {
        WishlistItem item = getOwnedWishlistItem(userId, itemId);
        Wishlist wishlist = item.getWishlist();
        wishlist.getItems().remove(item);
        wishlistItemRepository.delete(item);

        Wishlist refreshed = wishlistRepository.findByUserId(userId).orElseThrow();
        return WishlistResponse.from(refreshed);
    }

    @Override
    public WishlistResponse moveToCart(Long userId, Long itemId) {
        WishlistItem item = getOwnedWishlistItem(userId, itemId);
        Long productId = item.getProduct().getId();

        // Add to cart (quantity = 1)
        cartService.addItem(userId, new CartItemRequest(productId, 1));

        // Remove from wishlist
        Wishlist wishlist = item.getWishlist();
        wishlist.getItems().remove(item);
        wishlistItemRepository.delete(item);

        Wishlist refreshed = wishlistRepository.findByUserId(userId).orElseThrow();
        return WishlistResponse.from(refreshed);
    }

    // ─── Private Helpers ─────────────────────────────────────

    private Wishlist createEmptyWishlist(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
        Wishlist wishlist = Wishlist.builder().user(user).build();
        return wishlistRepository.save(wishlist);
    }

    private WishlistItem getOwnedWishlistItem(Long userId, Long itemId) {
        WishlistItem item = wishlistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Wishlist item not found"));

        if (!item.getWishlist().getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not own this wishlist item");
        }
        return item;
    }
}
