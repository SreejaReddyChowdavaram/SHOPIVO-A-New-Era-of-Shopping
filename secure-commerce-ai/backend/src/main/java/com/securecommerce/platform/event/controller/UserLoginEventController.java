package com.securecommerce.platform.event.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.event.dto.LoginEventResponse;
import com.securecommerce.platform.event.entity.UserLoginEvent;
import com.securecommerce.platform.event.service.LoginActivityService;
import com.securecommerce.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * UserLoginEventController — Self-service authentication activity endpoints for CUSTOMER, SELLER, and ADMIN.
 *
 * Each authenticated user can only view their own login activity and security logs.
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class UserLoginEventController {

    private final LoginActivityService loginActivityService;

    /**
     * GET /api/auth/login-history
     * Retrieve recent login history for the authenticated user.
     */
    @GetMapping("/login-history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<LoginEventResponse>>> getMyLoginHistory(
            @AuthenticationPrincipal User currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        List<UserLoginEvent> events = loginActivityService.getRecentLoginHistory(currentUser.getId());
        List<LoginEventResponse> responseList = events.stream()
                .map(LoginEventResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Login history retrieved successfully", responseList));
    }
}

