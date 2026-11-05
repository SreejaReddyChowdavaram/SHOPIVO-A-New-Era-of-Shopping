package com.securecommerce.platform;

import com.securecommerce.platform.category.entity.Category;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.product.dto.ProductRequest;
import com.securecommerce.platform.product.dto.ProductResponse;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.product.service.ProductService;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminProductModerationIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductService productService;
    @Autowired private PasswordEncoder passwordEncoder;

    private User admin;
    private User seller;
    private User customer;
    private Category category;

    @BeforeEach
    void setUp() {
        admin = userRepository.save(User.builder()
                .firstName("Admin")
                .lastName("User")
                .email("admin_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .role(User.Role.ADMIN)
                .enabled(true)
                .build());

        seller = userRepository.save(User.builder()
                .firstName("Sarah")
                .lastName("Seller")
                .email("seller_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("SellerPass123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        customer = userRepository.save(User.builder()
                .firstName("Chris")
                .lastName("Customer")
                .email("customer_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("CustomerPass123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Wearables " + System.nanoTime())
                .slug("wearables-" + System.nanoTime())
                .description("Smart Watches & Fitness Bands")
                .build());
    }

    @Test
    @DisplayName("Admin can list and filter products by status and search keyword")
    void adminCanListAndFilterProducts() {
        // Create 1 pending, 1 approved, 1 rejected product
        Product pending = productRepository.save(Product.builder()
                .seller(seller)
                .category(category)
                .name("Smart Ring Gen 1")
                .slug("smart-ring-gen-1-" + System.nanoTime())
                .price(new BigDecimal("9999.00"))
                .stockQuantity(15)
                .status(Product.Status.PENDING)
                .build());

        Product approved = productRepository.save(Product.builder()
                .seller(seller)
                .category(category)
                .name("Fitness Tracker Pro")
                .slug("fitness-tracker-pro-" + System.nanoTime())
                .price(new BigDecimal("2999.00"))
                .stockQuantity(40)
                .status(Product.Status.APPROVED)
                .build());

        Product rejected = productRepository.save(Product.builder()
                .seller(seller)
                .category(category)
                .name("Defective Sensor Band")
                .slug("defective-sensor-band-" + System.nanoTime())
                .price(new BigDecimal("499.00"))
                .stockQuantity(5)
                .status(Product.Status.REJECTED)
                .rejectionReason("Misleading product description")
                .build());

        // 1. Admin lists all products
        List<ProductResponse> all = productService.getAdminProducts(null, null);
        assertThat(all).extracting(ProductResponse::id)
                .contains(pending.getId(), approved.getId(), rejected.getId());

        // 2. Filter by PENDING
        List<ProductResponse> pendingList = productService.getAdminProducts(Product.Status.PENDING, null);
        assertThat(pendingList).extracting(ProductResponse::id).contains(pending.getId());
        assertThat(pendingList).extracting(ProductResponse::id).doesNotContain(approved.getId(), rejected.getId());

        // 3. Filter by APPROVED
        List<ProductResponse> approvedList = productService.getAdminProducts(Product.Status.APPROVED, null);
        assertThat(approvedList).extracting(ProductResponse::id).contains(approved.getId());
        assertThat(approvedList).extracting(ProductResponse::id).doesNotContain(pending.getId(), rejected.getId());

        // 4. Search by keyword
        List<ProductResponse> searchResults = productService.getAdminProducts(null, "Ring");
        assertThat(searchResults).extracting(ProductResponse::id).contains(pending.getId());
        assertThat(searchResults).extracting(ProductResponse::id).doesNotContain(approved.getId(), rejected.getId());
    }

    @Test
    @DisplayName("Approval workflow: PENDING becomes APPROVED and becomes visible to customers, preserving price/stock")
    void approveProduct_transitionsToApproved_andBecomesVisibleToCustomers() {
        // Seller creates product (default status is PENDING)
        ProductResponse created = productService.createProduct(seller.getId(), new ProductRequest(
                "Wireless Earbuds Ultra",
                "High fidelity noise cancelling earbuds",
                new BigDecimal("4999.00"),
                25,
                "https://images.example.com/earbuds.jpg",
                category.getId()
        ));
        assertThat(created.status()).isEqualTo("PENDING");

        // Customer cannot see PENDING product
        Page<ProductResponse> customerBrowseBefore = productService.getApprovedProducts(0, 10, null, "Earbuds");
        assertThat(customerBrowseBefore.getContent()).isEmpty();
        assertThatThrownBy(() -> productService.getApprovedProductById(created.id()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Product not found");

        // Admin approves product
        ProductResponse approved = productService.approveProduct(created.id());
        assertThat(approved.status()).isEqualTo("APPROVED");
        assertThat(approved.rejectionReason()).isNull();

        // Verify price, stock, and seller are unchanged
        assertThat(approved.price()).isEqualByComparingTo("4999.00");
        assertThat(approved.stockQuantity()).isEqualTo(25);
        assertThat(approved.sellerId()).isEqualTo(seller.getId());

        // Customer CAN now see the APPROVED product
        Page<ProductResponse> customerBrowseAfter = productService.getApprovedProducts(0, 10, null, "Earbuds");
        assertThat(customerBrowseAfter.getContent()).hasSize(1);
        assertThat(customerBrowseAfter.getContent().get(0).id()).isEqualTo(created.id());

        ProductResponse customerDetail = productService.getApprovedProductById(created.id());
        assertThat(customerDetail).isNotNull();
        assertThat(customerDetail.id()).isEqualTo(created.id());
    }

    @Test
    @DisplayName("Rejection workflow: PENDING becomes REJECTED with reason, invisible to customers, preserving integrity")
    void rejectProduct_transitionsToRejected_andPreservesReason() {
        // Seller creates product
        ProductResponse created = productService.createProduct(seller.getId(), new ProductRequest(
                "Prohibited Laser Pointer",
                "High power laser",
                new BigDecimal("1200.00"),
                10,
                null,
                category.getId()
        ));
        assertThat(created.status()).isEqualTo("PENDING");

        // Admin rejects product with reason
        String reason = "Item violates platform safety standards for high-powered lasers";
        ProductResponse rejected = productService.rejectProduct(created.id(), reason);
        assertThat(rejected.status()).isEqualTo("REJECTED");
        assertThat(rejected.rejectionReason()).isEqualTo(reason);

        // Verify integrity: price, stock, seller are untouched
        assertThat(rejected.price()).isEqualByComparingTo("1200.00");
        assertThat(rejected.stockQuantity()).isEqualTo(10);
        assertThat(rejected.sellerId()).isEqualTo(seller.getId());

        // Customer cannot view rejected product
        Page<ProductResponse> customerBrowse = productService.getApprovedProducts(0, 10, null, "Laser");
        assertThat(customerBrowse.getContent()).isEmpty();
        assertThatThrownBy(() -> productService.getApprovedProductById(created.id()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Product not found");

        // Seller can view product and see the rejection reason
        ProductResponse sellerView = productService.getProductByIdAsSellerOrAdmin(created.id(), seller.getId(), false);
        assertThat(sellerView.status()).isEqualTo("REJECTED");
        assertThat(sellerView.rejectionReason()).isEqualTo(reason);
    }

    @Test
    @DisplayName("Transition rules: cannot approve or reject non-PENDING products")
    void invalidStatusTransitions_rejectedWithBadRequest() {
        // 1. Create an already APPROVED product
        Product approved = productRepository.save(Product.builder()
                .seller(seller)
                .category(category)
                .name("Smart Scale")
                .slug("smart-scale-" + System.nanoTime())
                .price(new BigDecimal("1999.00"))
                .stockQuantity(30)
                .status(Product.Status.APPROVED)
                .build());

        // Cannot re-approve an approved product
        assertThatThrownBy(() -> productService.approveProduct(approved.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only PENDING products can be approved");

        // Cannot reject an approved product directly
        assertThatThrownBy(() -> productService.rejectProduct(approved.getId(), "Some reason"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only PENDING products can be rejected");

        // 2. Create an already REJECTED product
        Product rejected = productRepository.save(Product.builder()
                .seller(seller)
                .category(category)
                .name("Counterfeit Watch")
                .slug("counterfeit-watch-" + System.nanoTime())
                .price(new BigDecimal("999.00"))
                .stockQuantity(10)
                .status(Product.Status.REJECTED)
                .build());

        // Cannot reject an already rejected product
        assertThatThrownBy(() -> productService.rejectProduct(rejected.getId(), "Another reason"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only PENDING products can be rejected");

        // Cannot approve a rejected product directly (seller must re-submit or edit)
        assertThatThrownBy(() -> productService.approveProduct(rejected.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only PENDING products can be approved");
    }

    @Test
    @DisplayName("Authorization: Unrelated seller cannot access other seller's product detail via seller endpoint")
    void authorization_unrelatedSellerBlocked() {
        User otherSeller = userRepository.save(User.builder()
                .firstName("Other")
                .lastName("Seller")
                .email("other_seller_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        Product product = productRepository.save(Product.builder()
                .seller(seller)
                .category(category)
                .name("Private Seller Gadget")
                .slug("private-seller-gadget-" + System.nanoTime())
                .price(new BigDecimal("5000.00"))
                .stockQuantity(5)
                .status(Product.Status.PENDING)
                .build());

        // Other seller cannot view this product
        assertThatThrownBy(() -> productService.getProductByIdAsSellerOrAdmin(product.getId(), otherSeller.getId(), false))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("You are not authorized to view this product");

        // Admin CAN view it
        ProductResponse adminView = productService.getProductByIdAsSellerOrAdmin(product.getId(), admin.getId(), true);
        assertThat(adminView).isNotNull();
        assertThat(adminView.id()).isEqualTo(product.getId());
    }
}
