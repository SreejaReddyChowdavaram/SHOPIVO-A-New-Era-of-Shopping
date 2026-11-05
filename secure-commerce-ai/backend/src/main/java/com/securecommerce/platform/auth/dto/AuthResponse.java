package com.securecommerce.platform.auth.dto;

import com.securecommerce.platform.user.dto.UserResponse;
import lombok.Builder;
import lombok.Getter;

/**
 * AuthResponse — returned by register and login endpoints
 *
 * Shape:
 * {
 *   "accessToken": "eyJhbGci...",
 *   "tokenType": "Bearer",
 *   "user": { "id": 1, "email": "...", "firstName": "...", "role": "CUSTOMER" }
 * }
 *
 * This is wrapped in ApiResponse<AuthResponse> by the controller, so the actual
 * JSON response is:
 * {
 *   "success": true,
 *   "data": { "accessToken": "...", "tokenType": "Bearer", "user": {...} }
 * }
 *
 * The frontend authService reads: response.data.data.accessToken
 */
@Getter
@Builder
public class AuthResponse {

    private String accessToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private UserResponse user;
}
