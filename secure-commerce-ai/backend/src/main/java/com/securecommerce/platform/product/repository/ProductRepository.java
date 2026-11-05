package com.securecommerce.platform.product.repository;

import com.securecommerce.platform.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Customer browse: APPROVED products, optional category filter, optional text search.
     * countQuery is separate so Spring Data can execute COUNT(*) efficiently without the JOINs.
     */
    @Query(
        value = "SELECT p FROM Product p LEFT JOIN FETCH p.category c LEFT JOIN FETCH p.seller s " +
                "WHERE p.status = 'APPROVED' " +
                "AND (:categoryId IS NULL OR c.id = :categoryId) " +
                "AND (:search IS NULL OR :search = '' " +
                "     OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "     OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                "ORDER BY p.createdAt DESC",
        countQuery = "SELECT COUNT(p) FROM Product p LEFT JOIN p.category c " +
                "WHERE p.status = 'APPROVED' " +
                "AND (:categoryId IS NULL OR c.id = :categoryId) " +
                "AND (:search IS NULL OR :search = '' " +
                "     OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "     OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))"
    )
    Page<Product> findApproved(
            @Param("categoryId") Long categoryId,
            @Param("search") String search,
            Pageable pageable
    );

    /**
     * Single product by ID — only APPROVED (used for customer detail view).
     */
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.seller " +
           "WHERE p.id = :id AND p.status = 'APPROVED'")
    Optional<Product> findApprovedById(@Param("id") Long id);

    /**
     * Full product by ID regardless of status — used by seller edit and admin review.
     */
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.seller " +
           "WHERE p.id = :id")
    Optional<Product> findByIdWithDetails(@Param("id") Long id);

    /** Seller's own products list */
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category " +
           "WHERE p.seller.id = :sellerId ORDER BY p.createdAt DESC")
    List<Product> findBySellerId(@Param("sellerId") Long sellerId);

    boolean existsBySlug(String slug);

    /** All products with a given status — used for admin pending review list */
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.seller " +
           "WHERE p.status = :status ORDER BY p.createdAt DESC")
    List<Product> findByStatus(@Param("status") Product.Status status);

    /**
     * Admin products query with optional status filter and search keyword.
     */
    @Query("SELECT DISTINCT p FROM Product p " +
           "LEFT JOIN FETCH p.category c " +
           "LEFT JOIN FETCH p.seller s " +
           "WHERE (:status IS NULL OR p.status = :status) " +
           "AND (:search IS NULL OR :search = '' " +
           "     OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(s.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(s.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.createdAt DESC")
    List<Product> findForAdmin(@Param("status") Product.Status status, @Param("search") String search);

    long countBySellerId(Long sellerId);

    long countBySellerIdAndStatus(Long sellerId, Product.Status status);

    long countByStatus(Product.Status status);
}
