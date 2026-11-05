package com.securecommerce.platform.user.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.user.dto.AdminUserDetailResponse;
import com.securecommerce.platform.user.dto.AdminUserListItemResponse;
import com.securecommerce.platform.user.dto.AdminUserSummaryMetricsResponse;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * AdminUserController — Platform user account administration.
 * Strictly protected with @PreAuthorize("hasRole('ADMIN')").
 * Base path: /admin/users (mapped under /api/admin/users)
 */
@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    /**
     * GET /api/admin/users
     * Paged user listing with role, status, and search filters.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminUserListItemResponse>>> getUsers(
            @RequestParam(required = false) User.Role role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Boolean isEnabled = enabled;
        if (isEnabled == null && status != null) {
            if ("ACTIVE".equalsIgnoreCase(status)) {
                isEnabled = true;
            } else if ("SUSPENDED".equalsIgnoreCase(status)) {
                isEnabled = false;
            }
        }

        int pageSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<AdminUserListItemResponse> users = adminUserService.getUsersPaged(role, isEnabled, search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Platform users retrieved", users));
    }

    /**
     * GET /api/admin/users/{id}
     * Inspect individual user account details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserDetailResponse>> getUserDetail(@PathVariable Long id) {
        AdminUserDetailResponse detail = adminUserService.getUserDetail(id);
        return ResponseEntity.ok(ApiResponse.success("User detail retrieved", detail));
    }

    /**
     * PATCH /api/admin/users/{id}/suspend
     * Suspend user account with administrator safeguards.
     */
    @PatchMapping("/{id}/suspend")
    public ResponseEntity<ApiResponse<AdminUserDetailResponse>> suspendUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        AdminUserDetailResponse updated = adminUserService.suspendUser(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("User account suspended successfully", updated));
    }

    /**
     * PATCH /api/admin/users/{id}/activate
     * Activate previously suspended user account.
     */
    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<AdminUserDetailResponse>> activateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        AdminUserDetailResponse updated = adminUserService.activateUser(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("User account activated successfully", updated));
    }

    /**
     * GET /api/admin/users/metrics
     * Operational account metrics for Admin Dashboard monitoring.
     */
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<AdminUserSummaryMetricsResponse>> getUserMetrics() {
        AdminUserSummaryMetricsResponse metrics = adminUserService.getUserMetrics();
        return ResponseEntity.ok(ApiResponse.success("Platform user metrics retrieved", metrics));
    }
}
