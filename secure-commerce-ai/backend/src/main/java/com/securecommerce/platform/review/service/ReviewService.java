package com.securecommerce.platform.review.service;

import com.securecommerce.platform.review.dto.*;
import com.securecommerce.platform.user.entity.User;

public interface ReviewService {

    ProductReviewSummaryResponse getProductReviews(Long productId);

    ReviewEligibilityResponse checkReviewEligibility(Long productId, User customer);

    ReviewResponse createReview(CreateReviewRequest request, User customer);

    ReviewResponse updateReview(Long reviewId, UpdateReviewRequest request, User customer);

    void deleteReview(Long reviewId, User customer);

    SellerReviewSummaryResponse getSellerReviews(Long sellerId);

    AdminReviewSummaryResponse getAdminReviews();
}
