package com.securecommerce.platform.product.dto;

import com.securecommerce.platform.product.entity.Product;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * ProductResponse — Safe DTO sent to clients.
 * Never exposes internal seller details beyond name and id.
 */
public record ProductResponse(
        Long id,
        String name,
        String slug,
        String description,
        BigDecimal price,
        int stockQuantity,
        String imageUrl,
        String status,
        Long categoryId,
        String categoryName,
        Long sellerId,
        String sellerName,
        String rejectionReason,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProductResponse from(Product p) {
        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getDescription(),
                p.getPrice(),
                p.getStockQuantity(),
                p.getImageUrl(),
                p.getStatus().name(),
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getCategory() != null ? p.getCategory().getName() : null,
                p.getSeller() != null ? p.getSeller().getId() : null,
                p.getSeller() != null ? p.getSeller().getFullName() : null,
                p.getRejectionReason(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
