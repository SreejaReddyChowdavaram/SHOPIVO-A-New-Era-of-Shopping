package com.securecommerce.platform.auth.dto;

import com.securecommerce.platform.user.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * LoginRequest — incoming body for POST /api/auth/login
 */
@Data
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    /**
     * Optional portal role (CUSTOMER, SELLER, ADMIN) from the specific portal.
     * When provided, backend strictly validates that the user's registered role matches.
     */
    private User.Role portalRole;
}
