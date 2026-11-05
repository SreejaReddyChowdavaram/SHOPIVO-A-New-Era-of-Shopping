package com.securecommerce.platform.user.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.user.dto.ChangePasswordRequest;
import com.securecommerce.platform.user.dto.UpdateProfileRequest;
import com.securecommerce.platform.user.dto.UserResponse;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * UserController — Endpoints for authenticated user profile management and account security.
 *
 * GET /api/user/profile   → get current user's profile
 * PUT /api/user/profile   → update personal profile (firstName, lastName)
 * PUT /api/user/password  → change password securely
 */
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * GET /api/user/profile
     * Fetch current authenticated user's profile details.
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(
            @AuthenticationPrincipal User currentUser) {
        UserResponse response = userService.getProfile(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved", response));
    }

    /**
     * PUT /api/user/profile
     * Update user's personal details.
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = userService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    /**
     * PUT /api/user/password
     * Change user password after verifying current credentials.
     */
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
