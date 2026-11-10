package com.securecommerce.platform.auth.dto;

import com.securecommerce.platform.user.entity.User;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "Registered email address is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotNull(message = "Portal role is required")
    private User.Role portalRole;

    private String otp;

    private String resetToken;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(
        regexp = ".*[0-9!@#$%^&*].*",
        message = "Password must contain at least one number or special character"
    )
    private String newPassword;

    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;
}

