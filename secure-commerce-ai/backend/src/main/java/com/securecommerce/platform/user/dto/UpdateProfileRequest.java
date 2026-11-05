package com.securecommerce.platform.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * UpdateProfileRequest — DTO for updating user profile fields.
 * Email is intentionally omitted because email changes require separate verification.
 */
public record UpdateProfileRequest(
        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name must not exceed 100 characters")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name must not exceed 100 characters")
        String lastName
) {}
