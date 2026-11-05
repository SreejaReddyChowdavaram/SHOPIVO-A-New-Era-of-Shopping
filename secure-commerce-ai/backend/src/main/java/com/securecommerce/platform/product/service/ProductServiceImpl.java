package com.securecommerce.platform.product.service;

import com.securecommerce.platform.category.entity.Category;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.product.dto.ProductRequest;
import com.securecommerce.platform.product.dto.ProductResponse;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ProductImageStorageService productImageStorageService;

    // ─── Customer Browse ──────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getApprovedProducts(int page, int size, Long categoryId, String search) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50)); // cap at 50 per page
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        return productRepository.findApproved(categoryId, searchTerm, pageable)
                .map(ProductResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getApprovedProductById(Long id) {
        return productRepository.findApprovedById(id)
                .map(ProductResponse::from)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found or not yet approved"));
    }

    // ─── Seller Operations ────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getSellerProducts(Long sellerId) {
        return productRepository.findBySellerId(sellerId)
                .stream()
                .map(ProductResponse::from)
                .toList();
    }

    @Override
    public ProductResponse createProduct(Long sellerId, ProductRequest request) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Seller not found"));

        Category category = resolveCategory(request.categoryId());

        String slug = generateUniqueSlug(request.name());

        Product product = Product.builder()
                .seller(seller)
                .category(category)
                .name(request.name())
                .slug(slug)
                .description(request.description())
                .price(request.price())
                .stockQuantity(request.stockQuantity())
                .imageUrl(request.imageUrl())
                .status(Product.Status.PENDING)
                .build();

        return ProductResponse.from(productRepository.save(product));
    }

    @Override
    public ProductResponse updateProduct(Long sellerId, Long productId, ProductRequest request) {
        Product product = productRepository.findByIdWithDetails(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        // 403 if seller doesn't own this product
        if (!product.getSeller().getId().equals(sellerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not authorized to edit this product");
        }

        Category category = resolveCategory(request.categoryId());

        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());
        product.setImageUrl(request.imageUrl());
        product.setCategory(category);
        // Reset to PENDING after edit so admin re-reviews
        product.setStatus(Product.Status.PENDING);

        return ProductResponse.from(productRepository.save(product));
    }

    @Override
    public ProductResponse updateStock(Long sellerId, Long productId, int stockQuantity) {
        Product product = productRepository.findByIdWithDetails(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        // 403 if seller doesn't own this product
        if (!product.getSeller().getId().equals(sellerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not authorized to update stock for this product");
        }

        // Validate non-negative stock (belt-and-suspenders on top of DTO validation)
        if (stockQuantity < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Stock quantity must be zero or greater");
        }

        // Stock-only update: status is NOT reset to PENDING.
        // An approved product that the seller restocks should remain approved.
        product.setStockQuantity(stockQuantity);

        return ProductResponse.from(productRepository.save(product));
    }

    // ─── Admin Operations ─────────────────────────────────────

    @Override
    public ProductResponse approveProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (product.getStatus() != Product.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only PENDING products can be approved. Current status: " + product.getStatus());
        }

        product.setStatus(Product.Status.APPROVED);
        product.setRejectionReason(null);
        return ProductResponse.from(productRepository.save(product));
    }

    @Override
    public ProductResponse rejectProduct(Long productId, String reason) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (product.getStatus() != Product.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only PENDING products can be rejected. Current status: " + product.getStatus());
        }

        product.setStatus(Product.Status.REJECTED);
        product.setRejectionReason(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Does not meet platform listing guidelines");
        return ProductResponse.from(productRepository.save(product));
    }

    @Override
    public ProductResponse rejectProduct(Long productId) {
        return rejectProduct(productId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getAdminProducts(Product.Status status, String search) {
        return productRepository.findForAdmin(status, search)
                .stream()
                .map(ProductResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getPendingProducts() {
        return productRepository.findByStatus(Product.Status.PENDING)
                .stream()
                .map(ProductResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductByIdAsSellerOrAdmin(Long productId, Long requesterId, boolean isAdmin) {
        Product product = productRepository.findByIdWithDetails(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (!isAdmin && !product.getSeller().getId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not authorized to view this product");
        }

        return ProductResponse.from(product);
    }

    // ─── Private Helpers ─────────────────────────────────────

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Category not found: " + categoryId));
    }

    private static final Pattern NON_LATIN   = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE  = Pattern.compile("[\\s]+");

    private String generateUniqueSlug(String name) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        String slug = NON_LATIN.matcher(
                WHITESPACE.matcher(normalized.toLowerCase(Locale.ENGLISH)).replaceAll("-")
        ).replaceAll("");

        // Ensure uniqueness by appending a counter if needed
        String candidate = slug;
        int counter = 1;
        while (productRepository.existsBySlug(candidate)) {
            candidate = slug + "-" + counter++;
        }
        return candidate;
    }

    @Override
    public com.securecommerce.platform.product.dto.ProductImageUploadResponse uploadProductImage(
            Long sellerId, Long productId, org.springframework.web.multipart.MultipartFile file) {
        Product product = productRepository.findByIdWithDetails(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + productId));

        if (!product.getSeller().getId().equals(sellerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not authorized to upload an image for this product");
        }

        String oldImageUrl = product.getImageUrl();
        String newImageUrl = productImageStorageService.storeImage(file);

        product.setImageUrl(newImageUrl);
        productRepository.save(product);

        if (oldImageUrl != null && !oldImageUrl.equals(newImageUrl)) {
            productImageStorageService.deleteOldImage(oldImageUrl);
        }

        return new com.securecommerce.platform.product.dto.ProductImageUploadResponse(product.getId(), newImageUrl);
    }
}
