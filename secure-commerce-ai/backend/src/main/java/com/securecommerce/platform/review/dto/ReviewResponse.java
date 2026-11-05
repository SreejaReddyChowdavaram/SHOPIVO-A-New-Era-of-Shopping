package com.securecommerce.platform.review.dto;

import com.securecommerce.platform.review.entity.Review;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        Long productId,
        String productName,
        Long customerId,
        String customerName,
        int rating,
        String reviewText,
        boolean verifiedPurchase,
        Instant createdAt,
        Instant updatedAt
) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getProduct() != null ? review.getProduct().getId() : null,
                review.getProduct() != null ? review.getProduct().getName() : null,
                review.getCustomer() != null ? review.getCustomer().getId() : null,
                review.getCustomer() != null ? review.getCustomer().getFullName() : "Verified Customer",
                review.getRating(),
                review.getReviewText(),
                review.isVerifiedPurchase(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
