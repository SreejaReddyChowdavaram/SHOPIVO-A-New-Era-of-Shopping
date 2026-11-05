package com.securecommerce.platform.review.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.review.dto.AdminReviewSummaryResponse;
import com.securecommerce.platform.review.service.ReviewService;
import com.securecommerce.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * AdminReviewController — Administrator review moderation and platform-wide review metrics.
 * Base path: /admin/reviews (mapped under /api/admin/reviews).
 * Strictly requires ADMIN role.
 */
@RestController
@RequestMapping("/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

    private final ReviewService reviewService;

    /**
     * Platform-wide review metrics and moderation listing.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AdminReviewSummaryResponse>> getAdminReviews() {
        AdminReviewSummaryResponse summary = reviewService.getAdminReviews();
        return ResponseEntity.ok(ApiResponse.success("Platform reviews retrieved", summary));
    }

    /**
     * Admin review moderation deletion.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        reviewService.deleteReview(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully by administrator", null));
    }
}
