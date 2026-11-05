package com.securecommerce.platform.product.dto;

import jakarta.validation.constraints.Min;

/**
 * StockUpdateRequest — Input DTO for the dedicated stock-update endpoint.
 *
 * PATCH /api/seller/products/{id}/stock
 *
 * Using a dedicated DTO (instead of ProductRequest) means:
 *   1. Only stockQuantity is updated — name, price, description, etc. are untouched.
 *   2. Stock-only edits do NOT reset the product status to PENDING.
 *      A seller adjusting stock of an already-approved product should not
 *      trigger a full re-review cycle.
 */
public record StockUpdateRequest(
        @Min(value = 0, message = "Stock quantity must be zero or greater")
        int stockQuantity
) {}
