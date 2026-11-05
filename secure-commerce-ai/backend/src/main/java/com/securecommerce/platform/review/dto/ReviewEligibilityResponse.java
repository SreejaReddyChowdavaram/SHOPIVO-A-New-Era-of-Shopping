package com.securecommerce.platform.review.dto;

public record ReviewEligibilityResponse(
        boolean eligible,
        boolean alreadyReviewed,
        ReviewResponse existingReview,
        String reason
) {}
