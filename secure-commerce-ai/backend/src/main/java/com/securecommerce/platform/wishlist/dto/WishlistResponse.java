package com.securecommerce.platform.wishlist.dto;

import com.securecommerce.platform.product.dto.ProductResponse;
import com.securecommerce.platform.wishlist.entity.Wishlist;
import com.securecommerce.platform.wishlist.entity.WishlistItem;

import java.time.Instant;
import java.util.List;

public record WishlistResponse(
        Long wishlistId,
        List<WishlistItemResponse> items,
        int totalItems
) {

    public record WishlistItemResponse(
            Long itemId,
            ProductResponse product,
            Instant addedAt
    ) {
        public static WishlistItemResponse from(WishlistItem item) {
            return new WishlistItemResponse(
                    item.getId(),
                    ProductResponse.from(item.getProduct()),
                    item.getAddedAt()
            );
        }
    }

    public static WishlistResponse from(Wishlist wishlist) {
        List<WishlistItemResponse> items = wishlist.getItems().stream()
                .map(WishlistItemResponse::from)
                .toList();
        return new WishlistResponse(wishlist.getId(), items, items.size());
    }
}
