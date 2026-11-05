package com.securecommerce.platform.category.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Category.java — JPA Entity for product categories.
 *
 * Supports self-referential parent/children for nested categories
 * (e.g., Electronics → Phones, Laptops).
 * Parent is optional — root categories have parent = null.
 */
@Entity
@Table(name = "categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Self-referential parent category (null = root) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Category parent;

    /** Child categories (not loaded eagerly — use only when needed) */
    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Category> children = new ArrayList<>();

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
