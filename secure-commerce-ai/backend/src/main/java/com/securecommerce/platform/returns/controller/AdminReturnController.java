package com.securecommerce.platform.returns.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.returns.dto.ReturnResponse;
import com.securecommerce.platform.returns.dto.SellerRefundSummaryDto;
import com.securecommerce.platform.returns.service.ReturnService;
import com.securecommerce.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping(value = {"/admin/refunds", "/admin/returns"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReturnController {

    private final ReturnService returnService;

    /**
     * Admin platform-wide monitoring of all refund requests.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SellerRefundSummaryDto>> getAdminRefunds(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        SellerRefundSummaryDto summary = returnService.getAdminRefunds(status, search);
        return ResponseEntity.ok(ApiResponse.success("Admin refund monitoring data retrieved", summary));
    }

    /**
     * Admin inspects details of a single refund request.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnResponse>> getAdminRefundById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ReturnResponse response = returnService.getReturnById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Admin refund details retrieved", response));
    }
}

