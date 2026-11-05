package com.securecommerce.platform.product.dto;

/**
 * ProductImageUploadResponse — Response payload after a successful product image upload.
 */
public record ProductImageUploadResponse(
        Long productId,
        String imageUrl
) {}
