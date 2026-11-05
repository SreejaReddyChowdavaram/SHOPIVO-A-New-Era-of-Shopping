package com.securecommerce.platform.returns.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.returns.dto.*;
import com.securecommerce.platform.returns.service.ReturnService;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/returns")
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;

    /**
     * Check if an order / order item is return-eligible.
     */
    @GetMapping("/eligibility")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReturnEligibilityResponse>> checkEligibility(
            @RequestParam Long orderId,
            @RequestParam(required = false) Long orderItemId,
            @AuthenticationPrincipal User currentUser) {
        ReturnEligibilityResponse response = returnService.checkEligibility(orderId, orderItemId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Return eligibility checked", response));
    }

    /**
     * Customer requests a return for a delivered order / item.
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ReturnResponse>> requestReturn(
            @Valid @RequestBody CreateReturnRequest request,
            @AuthenticationPrincipal User currentUser) {
        ReturnResponse response = returnService.requestReturn(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Return requested successfully", response));
    }

    /**
     * Sandbox Return Approval & Instant Refund simulation endpoint.
     */
    @PostMapping("/{id}/approve-sandbox")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReturnResponse>> processSandboxApproval(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ReturnResponse response = returnService.processSandboxApproval(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Return approved and refund processed (Sandbox)", response));
    }

    /**
     * Customer views their return requests history.
     */
    @GetMapping("/mine")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<ReturnResponse>>> getMyReturns(
            @AuthenticationPrincipal User currentUser) {
        List<ReturnResponse> returns = returnService.getMyReturns(currentUser);
        return ResponseEntity.ok(ApiResponse.success("Returns retrieved", returns));
    }

    /**
     * Customer views their refund transactions history.
     */
    @GetMapping("/refunds/mine")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<RefundResponse>>> getMyRefunds(
            @AuthenticationPrincipal User currentUser) {
        List<RefundResponse> refunds = returnService.getMyRefunds(currentUser);
        return ResponseEntity.ok(ApiResponse.success("Refunds retrieved", refunds));
    }

    /**
     * Customer views a specific return request.
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReturnResponse>> getReturnById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ReturnResponse response = returnService.getReturnById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Return details retrieved", response));
    }

    /**
     * Customer cancels an active return request.
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReturnResponse>> cancelReturn(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ReturnResponse response = returnService.cancelReturn(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Return request cancelled", response));
    }
}
