package com.securecommerce.platform.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateReviewRequest(
        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1 star")
        @Max(value = 5, message = "Rating cannot exceed 5 stars")
        Integer rating,

        @NotBlank(message = "Review text cannot be blank")
        @Size(min = 3, max = 2000, message = "Review text must be between 3 and 2000 characters")
        String reviewText
) {}
