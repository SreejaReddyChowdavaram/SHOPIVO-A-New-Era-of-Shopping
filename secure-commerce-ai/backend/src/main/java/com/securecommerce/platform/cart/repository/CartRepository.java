package com.securecommerce.platform.cart.repository;

import com.securecommerce.platform.cart.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    /**
     * Find cart by user ID — eagerly loads items and their products
     * to avoid N+1 queries when building the CartResponse.
     */
    @Query("SELECT c FROM Cart c LEFT JOIN FETCH c.items i LEFT JOIN FETCH i.product p " +
           "LEFT JOIN FETCH p.category WHERE c.user.id = :userId")
    Optional<Cart> findByUserId(@Param("userId") Long userId);
}
