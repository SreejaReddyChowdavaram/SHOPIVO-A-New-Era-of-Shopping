package com.securecommerce.platform.user.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.user.dto.AdminSellerDetailResponse;
import com.securecommerce.platform.user.dto.AdminSellerListItemResponse;
import com.securecommerce.platform.user.dto.AdminUserDetailResponse;
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
 * AdminSellerController — Platform seller account and catalog operational management.
 * Strictly protected with @PreAuthorize("hasRole('ADMIN')").
 * Base path: /admin/sellers (mapped under /api/admin/sellers)
 */
@RestController
@RequestMapping("/admin/sellers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSellerController {

    private final AdminUserService adminUserService;

    /**
     * GET /api/admin/sellers
     * Paged seller listing with status and keyword search.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminSellerListItemResponse>>> getSellers(
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

        Page<AdminSellerListItemResponse> sellers = adminUserService.getSellersPaged(isEnabled, search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Platform sellers retrieved", sellers));
    }

    /**
     * GET /api/admin/sellers/{id}
     * Inspect deep seller profile with catalog summary and order summary.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminSellerDetailResponse>> getSellerDetail(@PathVariable Long id) {
        AdminSellerDetailResponse detail = adminUserService.getSellerDetail(id);
        return ResponseEntity.ok(ApiResponse.success("Seller platform detail retrieved", detail));
    }

    /**
     * PATCH /api/admin/sellers/{id}/suspend
     * Suspend seller account.
     */
    @PatchMapping("/{id}/suspend")
    public ResponseEntity<ApiResponse<AdminUserDetailResponse>> suspendSeller(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        AdminUserDetailResponse updated = adminUserService.suspendUser(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Seller account suspended successfully", updated));
    }

    /**
     * PATCH /api/admin/sellers/{id}/activate
     * Activate previously suspended seller account.
     */
    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<AdminUserDetailResponse>> activateSeller(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        AdminUserDetailResponse updated = adminUserService.activateUser(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Seller account activated successfully", updated));
    }
}
