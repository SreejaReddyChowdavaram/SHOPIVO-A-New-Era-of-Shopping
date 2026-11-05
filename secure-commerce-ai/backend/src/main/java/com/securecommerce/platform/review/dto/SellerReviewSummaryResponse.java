package com.securecommerce.platform.review.dto;

import java.util.List;

public record SellerReviewSummaryResponse(
        double averageRating,
        long totalReviews,
        long rating5Count,
        long rating4Count,
        long rating3Count,
        long rating2Count,
        long rating1Count,
        List<ReviewResponse> reviews
) {}
