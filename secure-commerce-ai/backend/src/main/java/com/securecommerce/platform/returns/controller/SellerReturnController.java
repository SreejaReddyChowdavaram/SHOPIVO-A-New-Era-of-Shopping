package com.securecommerce.platform.returns.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.returns.dto.*;
import com.securecommerce.platform.returns.service.ReturnService;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping(value = {"/seller/refunds", "/seller/returns"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('SELLER')")
public class SellerReturnController {

    private final ReturnService returnService;

    /**
     * Seller lists refund requests for their own orders with KPI counters.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SellerRefundSummaryDto>> getSellerRefunds(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal User currentUser) {
        SellerRefundSummaryDto summary = returnService.getSellerRefunds(currentUser, status, search);
        return ResponseEntity.ok(ApiResponse.success("Seller refund requests retrieved", summary));
    }

    /**
     * Seller inspects details of a single refund request.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnResponse>> getSellerRefundById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ReturnResponse response = returnService.getReturnById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Refund details retrieved", response));
    }

    /**
     * Seller APPROVES a refund request.
     * Records seller ID, timestamp, and triggers platform refund with Razorpay.
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ReturnResponse>> approveRefund(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ReturnResponse response = returnService.approveRefundAsSeller(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Refund approved and processed successfully", response));
    }

    /**
     * Seller REJECTS a refund request with a mandatory reason.
     * Does NOT initiate a gateway refund.
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ReturnResponse>> rejectRefund(
            @PathVariable Long id,
            @Valid @RequestBody RejectReturnRequest request,
            @AuthenticationPrincipal User currentUser) {
        ReturnResponse response = returnService.rejectRefundAsSeller(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Refund request rejected", response));
    }
}

