package com.securecommerce.platform.product.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * ProductRequest — Input DTO for create and update operations.
 * Validated via Jakarta Bean Validation before reaching the service.
 */
public record ProductRequest(
        @NotBlank(message = "Product name is required")
        @Size(max = 255, message = "Name must be 255 characters or fewer")
        String name,

        @Size(max = 2000, message = "Description must be 2000 characters or fewer")
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", message = "Price must be zero or greater")
        BigDecimal price,

        @Min(value = 0, message = "Stock quantity must be zero or greater")
        int stockQuantity,

        String imageUrl,

        Long categoryId
) {}
