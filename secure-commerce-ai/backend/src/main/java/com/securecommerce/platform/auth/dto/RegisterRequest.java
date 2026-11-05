package com.securecommerce.platform.auth.dto;

import com.securecommerce.platform.user.entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * RegisterRequest — incoming body for POST /api/auth/register
 *
 * JAKARTA VALIDATION:
 *   @Valid on the controller parameter triggers validation of this object.
 *   If any constraint fails, Spring throws MethodArgumentNotValidException
 *   which is caught by GlobalExceptionHandler → 400 with error details.
 *
 *   The validation happens BEFORE onSubmit() in AuthService is called.
 *   This means AuthService can assume inputs are valid — no defensive checks needed.
 *
 * CONSTRAINT EXPLANATIONS:
 *   @NotBlank    → null, "", and "   " all fail (stricter than @NotNull)
 *   @Email       → must match RFC 5321 email format
 *   @Size(min=8) → at least 8 chars — enforced here AND at DB level
 *   @Pattern     → requires at least one digit or special char in password
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must be 100 characters or less")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must be 100 characters or less")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 255, message = "Email must be 255 characters or less")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(
        regexp = ".*[0-9!@#$%^&*].*",
        message = "Password must contain at least one number or special character"
    )
    private String password;

    // Role: only CUSTOMER or SELLER — ADMIN is not self-registerable
    @NotNull(message = "Role is required")
    private User.Role role;
}
