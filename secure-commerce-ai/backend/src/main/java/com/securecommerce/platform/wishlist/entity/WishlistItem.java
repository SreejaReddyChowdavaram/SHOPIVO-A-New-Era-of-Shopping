package com.securecommerce.platform.wishlist.entity;

import com.securecommerce.platform.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "wishlist_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wishlist_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Wishlist wishlist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Product product;

    @CreationTimestamp
    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;
}
