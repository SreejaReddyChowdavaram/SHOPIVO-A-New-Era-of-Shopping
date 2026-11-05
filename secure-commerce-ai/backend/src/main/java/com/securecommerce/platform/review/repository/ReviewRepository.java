package com.securecommerce.platform.review.repository;

import com.securecommerce.platform.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("SELECT r FROM Review r " +
           "JOIN FETCH r.product p " +
           "JOIN FETCH r.customer c " +
           "WHERE p.id = :productId " +
           "ORDER BY r.createdAt DESC")
    List<Review> findByProductIdOrderByCreatedAtDesc(@Param("productId") Long productId);

    @Query("SELECT r FROM Review r " +
           "JOIN FETCH r.product p " +
           "JOIN FETCH r.customer c " +
           "WHERE c.id = :customerId AND p.id = :productId")
    Optional<Review> findByCustomerIdAndProductId(@Param("customerId") Long customerId, @Param("productId") Long productId);

    boolean existsByCustomerIdAndProductId(Long customerId, Long productId);

    long countByProductId(Long productId);

    long countByProductIdAndRating(Long productId, int rating);

    @Query("SELECT COALESCE(AVG(CAST(r.rating AS double)), 0.0) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingByProductId(@Param("productId") Long productId);

    @Query("SELECT r FROM Review r " +
           "JOIN FETCH r.product p " +
           "JOIN FETCH r.customer c " +
           "WHERE p.seller.id = :sellerId " +
           "ORDER BY r.createdAt DESC")
    List<Review> findBySellerIdOrderByCreatedAtDesc(@Param("sellerId") Long sellerId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.seller.id = :sellerId")
    long countBySellerId(@Param("sellerId") Long sellerId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.seller.id = :sellerId AND r.rating = :rating")
    long countBySellerIdAndRating(@Param("sellerId") Long sellerId, @Param("rating") int rating);

    @Query("SELECT COALESCE(AVG(CAST(r.rating AS double)), 0.0) FROM Review r WHERE r.product.seller.id = :sellerId")
    Double getAverageRatingBySellerId(@Param("sellerId") Long sellerId);

    @Query("SELECT r FROM Review r " +
           "JOIN FETCH r.product p " +
           "JOIN FETCH r.customer c " +
           "ORDER BY r.createdAt DESC")
    List<Review> findAllWithDetailsOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(AVG(CAST(r.rating AS double)), 0.0) FROM Review r")
    Double getPlatformAverageRating();

    long countByRating(int rating);
}
