package com.securecommerce.platform.cart.entity;

import com.securecommerce.platform.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * CartItem.java — One row per product in a cart.
 *
 * priceAtAddition snapshots the product price at the moment of adding.
 * This means if the seller later changes the price, existing cart items
 * are unaffected — the customer sees the price they originally saw.
 *
 * The UNIQUE constraint on (cart_id, product_id) in the DB prevents
 * duplicate rows. The service increments quantity instead of inserting
 * a second row when the same product is added twice.
 */
@Entity
@Table(name = "cart_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Product product;

    @Column(nullable = false)
    private int quantity;

    /** Snapshot of the product's price at the time this item was added */
    @Column(name = "price_at_addition", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAtAddition;

    @CreationTimestamp
    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;
}
