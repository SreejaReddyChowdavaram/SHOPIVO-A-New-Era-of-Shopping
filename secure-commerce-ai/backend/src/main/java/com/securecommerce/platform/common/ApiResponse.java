package com.securecommerce.platform.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/**
 * ApiResponse — Unified API Response Wrapper
 *
 * WHY THIS EXISTS:
 *   Without a wrapper, different endpoints return data in inconsistent shapes.
 *   One endpoint returns just a product object. Another returns an error string.
 *   The frontend has to handle every shape differently.
 *
 *   With ApiResponse, EVERY endpoint returns the same shape:
 *   {
 *     "success": true,
 *     "message": "Product fetched successfully",
 *     "data": { ...product... },
 *     "timestamp": "2026-01-15T10:30:00Z"
 *   }
 *
 *   The frontend always knows: check success → read data or errors. Clean and predictable.
 *
 * DESIGN DECISIONS:
 *   - Generic type T means data can be any type (Product, List<Order>, etc.)
 *   - @JsonInclude(NON_NULL) → null fields are excluded from JSON output.
 *     "data" won't appear in error responses. "errors" won't appear in success responses.
 *   - @Builder (Lombok) → clean construction pattern without long constructors:
 *       ApiResponse.<ProductResponse>builder()
 *           .success(true)
 *           .message("Fetched")
 *           .data(product)
 *           .build()
 *   - Instant for timestamp → always UTC, no timezone confusion.
 *
 * USAGE IN CONTROLLERS (after auth phase):
 *   @GetMapping("/{id}")
 *   public ResponseEntity<ApiResponse<ProductResponse>> getProduct(@PathVariable Long id) {
 *       ProductResponse product = productService.findById(id);
 *       return ResponseEntity.ok(ApiResponse.success("Product fetched", product));
 *   }
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private Object errors;

    @Builder.Default
    private Instant timestamp = Instant.now();

    // ─────────────────────────────────────────
    // Static factory methods — convenience builders
    // ─────────────────────────────────────────

    /**
     * Success response with data payload
     * Used for: GET, PUT responses
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * Success response without data (e.g., delete operations)
     * Used for: DELETE responses, fire-and-forget operations
     */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .build();
    }

    /**
     * Error response with error details
     * Used by GlobalExceptionHandler — not called directly in controllers
     */
    public static <T> ApiResponse<T> error(String message, Object errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errors(errors)
                .build();
    }

    /**
     * Simple error response
     */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}
