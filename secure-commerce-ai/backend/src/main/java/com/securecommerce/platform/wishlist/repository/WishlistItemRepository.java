package com.securecommerce.platform.wishlist.repository;

import com.securecommerce.platform.wishlist.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    @Query("SELECT wi FROM WishlistItem wi WHERE wi.wishlist.id = :wishlistId AND wi.product.id = :productId")
    Optional<WishlistItem> findByWishlistIdAndProductId(
            @Param("wishlistId") Long wishlistId,
            @Param("productId") Long productId
    );
}
