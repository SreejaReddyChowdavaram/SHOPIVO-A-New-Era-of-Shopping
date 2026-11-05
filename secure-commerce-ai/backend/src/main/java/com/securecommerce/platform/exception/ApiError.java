package com.securecommerce.platform.exception;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

/**
 * ApiError — Structured Error Response Body
 *
 * WHY THIS EXISTS:
 *   When something goes wrong (validation failure, entity not found, unauthorized),
 *   the frontend needs a predictable error structure to display useful messages.
 *
 *   Without this, Spring Boot returns its own internal error format which
 *   is verbose, inconsistent, and exposes internal stack traces.
 *
 *   ApiError gives us control over exactly what error information is sent.
 *
 * FIELDS:
 *   status   → HTTP status code (400, 401, 403, 404, 500)
 *   error    → Short error category ("Validation Failed", "Not Found")
 *   message  → Human-readable description
 *   details  → List of field-level errors (e.g., ["email: must not be blank"])
 *   path     → Which endpoint triggered the error (e.g., "/api/auth/register")
 *   timestamp → When the error occurred
 *
 * EXAMPLE JSON RESPONSE (validation error):
 *   {
 *     "status": 400,
 *     "error": "Validation Failed",
 *     "message": "Request validation failed",
 *     "details": [
 *       "email: must be a valid email address",
 *       "password: size must be between 8 and 100"
 *     ],
 *     "path": "/api/auth/register",
 *     "timestamp": "2026-01-15T10:30:00Z"
 *   }
 */
@Getter
@Builder
public class ApiError {

    private int status;
    private String error;
    private String message;
    private List<String> details;
    private String path;

    @Builder.Default
    private Instant timestamp = Instant.now();
}
