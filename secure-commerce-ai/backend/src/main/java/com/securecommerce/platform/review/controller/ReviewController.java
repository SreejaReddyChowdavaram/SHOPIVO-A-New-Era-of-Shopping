package com.securecommerce.platform.review.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.review.dto.*;
import com.securecommerce.platform.review.service.ReviewService;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * Public endpoint: Get reviews and rating breakdown for a product.
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<ProductReviewSummaryResponse>> getProductReviews(
            @PathVariable Long productId) {
        ProductReviewSummaryResponse summary = reviewService.getProductReviews(productId);
        return ResponseEntity.ok(ApiResponse.success("Product reviews retrieved", summary));
    }

    /**
     * Authenticated endpoint: Get reviews and rating summary for seller's products.
     */
    @GetMapping("/seller")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SellerReviewSummaryResponse>> getSellerReviews(
            @AuthenticationPrincipal User currentUser) {
        SellerReviewSummaryResponse summary = reviewService.getSellerReviews(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Seller reviews retrieved", summary));
    }

    /**
     * Authenticated endpoint: Check if current customer is eligible to review the product.
     */
    @GetMapping("/eligibility/{productId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewEligibilityResponse>> checkEligibility(
            @PathVariable Long productId,
            @AuthenticationPrincipal User currentUser) {
        ReviewEligibilityResponse eligibility = reviewService.checkReviewEligibility(productId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Eligibility checked", eligibility));
    }

    /**
     * Customer endpoint: Submit a verified purchase review for a delivered product.
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal User currentUser) {
        ReviewResponse review = reviewService.createReview(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Review submitted successfully", review));
    }

    /**
     * Owner endpoint: Update their existing review.
     */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long id,
            @Valid @RequestBody UpdateReviewRequest request,
            @AuthenticationPrincipal User currentUser) {
        ReviewResponse review = reviewService.updateReview(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Review updated successfully", review));
    }

    /**
     * Owner endpoint: Delete their existing review.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        reviewService.deleteReview(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully", null));
    }
}
