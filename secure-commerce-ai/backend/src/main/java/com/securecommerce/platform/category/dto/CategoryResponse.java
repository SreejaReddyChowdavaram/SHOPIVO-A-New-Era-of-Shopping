package com.securecommerce.platform.category.dto;

import com.securecommerce.platform.category.entity.Category;

/**
 * CategoryResponse — Safe DTO returned by the API.
 * Uses a Java record for immutability and zero boilerplate.
 */
public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        Long parentId,
        boolean active
) {
    /** Static factory: convert entity → DTO */
    public static CategoryResponse from(Category c) {
        return new CategoryResponse(
                c.getId(),
                c.getName(),
                c.getSlug(),
                c.getDescription(),
                c.getParent() != null ? c.getParent().getId() : null,
                c.isActive()
        );
    }
}
