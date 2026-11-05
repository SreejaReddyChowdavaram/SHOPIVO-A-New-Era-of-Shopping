package com.securecommerce.platform.product.service;

import com.securecommerce.platform.product.dto.ProductRequest;
import com.securecommerce.platform.product.dto.ProductResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ProductService {

    /** Customer browse — paginated, APPROVED only, optional category + search filters */
    Page<ProductResponse> getApprovedProducts(int page, int size, Long categoryId, String search);

    /** Customer product detail — APPROVED only */
    ProductResponse getApprovedProductById(Long id);

    /** Seller's own products list */
    List<ProductResponse> getSellerProducts(Long sellerId);

    /** Seller creates a product (starts as PENDING) */
    ProductResponse createProduct(Long sellerId, ProductRequest request);

    /** Seller updates their own product — throws 403 if not owner */
    ProductResponse updateProduct(Long sellerId, Long productId, ProductRequest request);

    /**
     * Seller updates only the stock quantity of their own product.
     * Unlike updateProduct, this does NOT reset the product status to PENDING.
     * A stock adjustment on an already-approved product should not trigger re-review.
     *
     * @throws 403 if sellerId does not match the product's owner.
     */
    ProductResponse updateStock(Long sellerId, Long productId, int stockQuantity);

    /** Admin approves a product — changes status PENDING → APPROVED */
    ProductResponse approveProduct(Long productId);

    /** Admin rejects a product — changes status PENDING → REJECTED with optional reason */
    ProductResponse rejectProduct(Long productId, String reason);

    /** Overload for rejectProduct without reason */
    ProductResponse rejectProduct(Long productId);

    /** Get all PENDING products for admin review */
    List<ProductResponse> getPendingProducts();

    /** Get products for admin with status filter and search query */
    List<ProductResponse> getAdminProducts(com.securecommerce.platform.product.entity.Product.Status status, String search);

    /** Get any product by ID regardless of status — for seller/admin use */
    ProductResponse getProductByIdAsSellerOrAdmin(Long productId, Long requesterId, boolean isAdmin);

    /** Seller uploads or replaces an image for their own product */
    com.securecommerce.platform.product.dto.ProductImageUploadResponse uploadProductImage(
            Long sellerId, Long productId, org.springframework.web.multipart.MultipartFile file);
}

