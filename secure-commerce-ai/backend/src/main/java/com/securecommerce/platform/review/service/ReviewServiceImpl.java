package com.securecommerce.platform.review.service;

import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.review.dto.*;
import com.securecommerce.platform.review.entity.Review;
import com.securecommerce.platform.review.repository.ReviewRepository;
import com.securecommerce.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.service.EventLoggingService;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final EventLoggingService eventLoggingService;

    @Override
    @Transactional(readOnly = true)
    public ProductReviewSummaryResponse getProductReviews(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }

        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        List<ReviewResponse> reviewResponses = reviews.stream()
                .map(ReviewResponse::from)
                .toList();

        long totalReviews = reviews.size();
        double rawAvg = reviewRepository.getAverageRatingByProductId(productId);
        double roundedAvg = BigDecimal.valueOf(rawAvg)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();

        long r5 = reviewRepository.countByProductIdAndRating(productId, 5);
        long r4 = reviewRepository.countByProductIdAndRating(productId, 4);
        long r3 = reviewRepository.countByProductIdAndRating(productId, 3);
        long r2 = reviewRepository.countByProductIdAndRating(productId, 2);
        long r1 = reviewRepository.countByProductIdAndRating(productId, 1);

        return new ProductReviewSummaryResponse(
                roundedAvg,
                totalReviews,
                r5,
                r4,
                r3,
                r2,
                r1,
                reviewResponses
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewEligibilityResponse checkReviewEligibility(Long productId, User customer) {
        if (customer == null) {
            return new ReviewEligibilityResponse(false, false, null, "Sign in as a customer to review this product");
        }

        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }

        // 1. Check if customer already reviewed this product
        Optional<Review> existingReview = reviewRepository.findByCustomerIdAndProductId(customer.getId(), productId);
        if (existingReview.isPresent()) {
            return new ReviewEligibilityResponse(
                    false,
                    true,
                    ReviewResponse.from(existingReview.get()),
                    "You have already reviewed this product"
            );
        }

        // 2. Query customer's orders
        List<Order> customerOrders = orderRepository.findByCustomerIdWithItems(customer.getId());

        // Check if there is an eligible DELIVERED order with this product
        boolean hasDeliveredOrder = customerOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .anyMatch(o -> o.getItems().stream()
                        .anyMatch(item -> item.getProduct() != null && item.getProduct().getId().equals(productId)));

        if (hasDeliveredOrder) {
            return new ReviewEligibilityResponse(true, false, null, "Verified purchase: You are eligible to review this product");
        }

        // Check if customer ordered but not yet delivered
        boolean hasUndeliveredOrder = customerOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED && o.getStatus() != OrderStatus.DELIVERED)
                .anyMatch(o -> o.getItems().stream()
                        .anyMatch(item -> item.getProduct() != null && item.getProduct().getId().equals(productId)));

        if (hasUndeliveredOrder) {
            return new ReviewEligibilityResponse(false, false, null, "You can review this product once your order has been delivered");
        }

        return new ReviewEligibilityResponse(false, false, null, "Only verified buyers who have received this product can write a review");
    }

    @Override
    public ReviewResponse createReview(CreateReviewRequest request, User customer) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        // 1. Duplicate check
        if (reviewRepository.existsByCustomerIdAndProductId(customer.getId(), product.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have already submitted a review for this product");
        }

        // 2. Strict backend verification of DELIVERED purchase order
        List<Order> customerOrders = orderRepository.findByCustomerIdWithItems(customer.getId());

        Order eligibleOrder = customerOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .filter(o -> o.getItems().stream()
                        .anyMatch(item -> item.getProduct() != null && item.getProduct().getId().equals(product.getId())))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Only verified buyers with a delivered order for this product can submit a review"));

        // 3. Create review entity
        Review review = Review.builder()
                .product(product)
                .customer(customer)
                .order(eligibleOrder)
                .rating(request.rating())
                .reviewText(request.reviewText().trim())
                .verifiedPurchase(true)
                .build();

        Review saved = reviewRepository.save(review);

        eventLoggingService.logEvent(
                EventType.REVIEW_SUBMITTED,
                customer.getId(),
                "REVIEW",
                String.valueOf(saved.getId()),
                Map.of(
                        "productId", product.getId(),
                        "orderId", eligibleOrder.getId(),
                        "rating", saved.getRating()
                )
        );

        log.info("Review created: reviewId={}, customerId={}, productId={}, rating={}",
                saved.getId(), customer.getId(), product.getId(), saved.getRating());

        return ReviewResponse.from(saved);
    }

    @Override
    public ReviewResponse updateReview(Long reviewId, UpdateReviewRequest request, User customer) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getCustomer().getId().equals(customer.getId()) && customer.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to edit this review");
        }

        review.setRating(request.rating());
        review.setReviewText(request.reviewText().trim());

        Review updated = reviewRepository.save(review);

        log.info("Review updated: reviewId={}, customerId={}, newRating={}",
                updated.getId(), customer.getId(), updated.getRating());

        return ReviewResponse.from(updated);
    }

    @Override
    public void deleteReview(Long reviewId, User customer) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getCustomer().getId().equals(customer.getId()) && customer.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to delete this review");
        }

        reviewRepository.delete(review);

        log.info("Review deleted: reviewId={}, deletedBy={}", reviewId, customer.getEmail());
    }

    @Override
    @Transactional(readOnly = true)
    public SellerReviewSummaryResponse getSellerReviews(Long sellerId) {
        List<Review> reviews = reviewRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
        List<ReviewResponse> reviewResponses = reviews.stream()
                .map(ReviewResponse::from)
                .toList();

        long totalReviews = reviews.size();
        double rawAvg = reviewRepository.getAverageRatingBySellerId(sellerId);
        double roundedAvg = BigDecimal.valueOf(rawAvg)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();

        long r5 = reviewRepository.countBySellerIdAndRating(sellerId, 5);
        long r4 = reviewRepository.countBySellerIdAndRating(sellerId, 4);
        long r3 = reviewRepository.countBySellerIdAndRating(sellerId, 3);
        long r2 = reviewRepository.countBySellerIdAndRating(sellerId, 2);
        long r1 = reviewRepository.countBySellerIdAndRating(sellerId, 1);

        return new SellerReviewSummaryResponse(
                roundedAvg,
                totalReviews,
                r5,
                r4,
                r3,
                r2,
                r1,
                reviewResponses
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AdminReviewSummaryResponse getAdminReviews() {
        List<Review> reviews = reviewRepository.findAllWithDetailsOrderByCreatedAtDesc();
        List<ReviewResponse> reviewResponses = reviews.stream()
                .map(ReviewResponse::from)
                .toList();

        long totalReviews = reviews.size();
        double rawAvg = reviewRepository.getPlatformAverageRating();
        double roundedAvg = BigDecimal.valueOf(rawAvg)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();

        long r5 = reviewRepository.countByRating(5);
        long r4 = reviewRepository.countByRating(4);
        long r3 = reviewRepository.countByRating(3);
        long r2 = reviewRepository.countByRating(2);
        long r1 = reviewRepository.countByRating(1);

        return new AdminReviewSummaryResponse(
                roundedAvg,
                totalReviews,
                r5,
                r4,
                r3,
                r2,
                r1,
                reviewResponses
        );
    }
}
