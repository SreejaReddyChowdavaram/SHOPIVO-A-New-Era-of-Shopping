package com.securecommerce.platform.product.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.product.dto.ProductRequest;
import com.securecommerce.platform.product.dto.ProductResponse;
import com.securecommerce.platform.product.dto.StockUpdateRequest;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.service.ProductService;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.service.EventLoggingService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ProductController — REST endpoints for product operations.
 *
 * PUBLIC (no auth):
 *   GET /api/products            — browse approved products
 *   GET /api/products/{id}       — single product detail
 *
 * SELLER only:
 *   GET  /api/seller/products           — seller's own products
 *   POST /api/seller/products           — create product
 *   PUT  /api/seller/products/{id}      — update own product
 *   GET  /api/seller/products/{id}      — single product (own)
 *
 * ADMIN only:
 *   PUT /api/admin/products/{id}/approve
 *   PUT /api/admin/products/{id}/reject
 *   GET /api/admin/products/pending     — all pending products
 */
@RestController
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final EventLoggingService eventLoggingService;

    // ─── PUBLIC: Customer Browse ──────────────────────────────

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProducts(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal User currentUser) {

        Page<ProductResponse> products = productService.getApprovedProducts(page, size, categoryId, search);

        if ((search != null && !search.isBlank()) || categoryId != null) {
            Map<String, Object> meta = new HashMap<>();
            if (search != null && !search.isBlank()) meta.put("query", search.trim());
            if (categoryId != null) meta.put("categoryId", categoryId);
            meta.put("page", page);
            meta.put("totalResults", products.getTotalElements());

            eventLoggingService.logEvent(
                    EventType.PRODUCT_SEARCH,
                    currentUser != null ? currentUser.getId() : null,
                    "SEARCH",
                    null,
                    meta
            );
        }

        return ResponseEntity.ok(ApiResponse.success("Products retrieved", products));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ProductResponse product = productService.getApprovedProductById(id);

        Map<String, Object> meta = new HashMap<>();
        meta.put("productId", id);
        meta.put("name", product.name());
        if (product.price() != null) meta.put("price", product.price());
        if (product.categoryId() != null) meta.put("categoryId", product.categoryId());

        eventLoggingService.logEvent(
                EventType.PRODUCT_VIEW,
                currentUser != null ? currentUser.getId() : null,
                "PRODUCT",
                String.valueOf(id),
                meta
        );

        return ResponseEntity.ok(ApiResponse.success("Product retrieved", product));
    }

    // ─── SELLER: Own Products ─────────────────────────────────

    @GetMapping("/seller/products")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getSellerProducts(
            @AuthenticationPrincipal User currentUser) {

        List<ProductResponse> products = productService.getSellerProducts(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Seller products retrieved", products));
    }

    @GetMapping("/seller/products/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<ProductResponse>> getSellerProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {

        ProductResponse product = productService.getProductByIdAsSellerOrAdmin(
                id, currentUser.getId(), false);
        return ResponseEntity.ok(ApiResponse.success("Product retrieved", product));
    }

    @PostMapping("/seller/products")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal User currentUser) {

        ProductResponse product = productService.createProduct(currentUser.getId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product submitted for review", product));
    }

    @PutMapping("/seller/products/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal User currentUser) {

        ProductResponse product = productService.updateProduct(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated and resubmitted for review", product));
    }

    /**
     * PATCH /api/seller/products/{id}/stock
     *
     * Updates only the stock quantity of the seller's own product.
     * Unlike PUT (full update), a stock-only adjustment does NOT reset
     * the product status to PENDING — an approved product stays approved.
     */
    @PatchMapping("/seller/products/{id}/stock")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductStock(
            @PathVariable Long id,
            @Valid @RequestBody StockUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {

        ProductResponse product = productService.updateStock(
                currentUser.getId(), id, request.stockQuantity());
        return ResponseEntity.ok(ApiResponse.success("Stock updated successfully", product));
    }

    /**
     * POST /api/seller/products/{id}/image
     * Uploads or replaces the image for a product owned by the authenticated seller.
     */
    @PostMapping(value = "/seller/products/{id}/image", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<com.securecommerce.platform.product.dto.ProductImageUploadResponse>> uploadProductImage(
            @PathVariable Long id,
            @RequestParam("image") org.springframework.web.multipart.MultipartFile image,
            @AuthenticationPrincipal User currentUser) {

        com.securecommerce.platform.product.dto.ProductImageUploadResponse response =
                productService.uploadProductImage(currentUser.getId(), id, image);
        return ResponseEntity.ok(ApiResponse.success("Product image uploaded successfully", response));
    }

    // ─── ADMIN: Moderation ────────────────────────────────────

    @GetMapping("/admin/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAdminProducts(
            @RequestParam(required = false) Product.Status status,
            @RequestParam(required = false) String search) {
        List<ProductResponse> products = productService.getAdminProducts(status, search);
        return ResponseEntity.ok(ApiResponse.success("Admin products retrieved", products));
    }

    @GetMapping("/admin/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> getAdminProductById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ProductResponse product = productService.getProductByIdAsSellerOrAdmin(id, currentUser.getId(), true);
        return ResponseEntity.ok(ApiResponse.success("Admin product details retrieved", product));
    }

    @RequestMapping(value = "/admin/products/{id}/approve", method = {RequestMethod.PUT, RequestMethod.PATCH})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> approveProduct(@PathVariable Long id) {
        ProductResponse product = productService.approveProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product approved successfully", product));
    }

    @RequestMapping(value = "/admin/products/{id}/reject", method = {RequestMethod.PUT, RequestMethod.PATCH})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> rejectProduct(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) com.securecommerce.platform.product.dto.RejectProductRequest request) {
        String reason = request != null ? request.reason() : null;
        ProductResponse product = productService.rejectProduct(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Product rejected", product));
    }

    @GetMapping("/admin/products/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getPendingProducts() {
        List<ProductResponse> products = productService.getPendingProducts();
        return ResponseEntity.ok(ApiResponse.success("Pending products retrieved", products));
    }
}
