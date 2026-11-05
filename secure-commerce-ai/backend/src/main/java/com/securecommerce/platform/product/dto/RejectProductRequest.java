package com.securecommerce.platform.product.dto;

import jakarta.validation.constraints.Size;

/**
 * RejectProductRequest — Optional payload when an admin rejects a product.
 */
public record RejectProductRequest(
        @Size(max = 1000, message = "Rejection reason cannot exceed 1000 characters")
        String reason
) {}
