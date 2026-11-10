package com.securecommerce.platform.auth.dto;

import com.securecommerce.platform.user.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GoogleAuthRequest — incoming body for POST /api/auth/google
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAuthRequest {

    @NotBlank(message = "Google ID token credential is required")
    private String credential;

    @NotNull(message = "Target portal role is required")
    private User.Role portalRole;

    private String storeName;
    private String phoneNumber;
}
