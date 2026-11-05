package com.securecommerce.platform;

import com.securecommerce.platform.address.entity.Address;
import com.securecommerce.platform.address.repository.AddressRepository;
import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.service.CartService;
import com.securecommerce.platform.category.entity.Category;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.order.dto.OrderRequest;
import com.securecommerce.platform.order.dto.OrderResponse;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.review.controller.AdminReviewController;
import com.securecommerce.platform.review.dto.AdminReviewSummaryResponse;
import com.securecommerce.platform.review.dto.CreateReviewRequest;
import com.securecommerce.platform.review.dto.ReviewResponse;
import com.securecommerce.platform.review.dto.SellerReviewSummaryResponse;
import com.securecommerce.platform.review.repository.ReviewRepository;
import com.securecommerce.platform.review.service.ReviewService;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminReviewIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private CartService cartService;
    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private ReviewService reviewService;
    @Autowired private AdminReviewController adminReviewController;
    @Autowired private PasswordEncoder passwordEncoder;

    private User admin;
    private User seller1;
    private User seller2;
    private User customer1;
    private User customer2;

    private Product product1;
    private Product product2;

    private Address customer1Address;
    private Address customer2Address;

    @BeforeEach
    void setUp() {
        String token = java.util.UUID.randomUUID().toString().replaceAll("[^a-zA-Z]", "").toLowerCase();

        admin = userRepository.save(User.builder()
                .firstName("Arthur")
                .lastName("Admin")
                .email("admin_rev_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .role(User.Role.ADMIN)
                .enabled(true)
                .build());

        seller1 = userRepository.save(User.builder()
                .firstName("Sophia")
                .lastName("SellerOne")
                .email("seller_rev1_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("SellerPass123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        seller2 = userRepository.save(User.builder()
                .firstName("Sam")
                .lastName("SellerTwo")
                .email("seller_rev2_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("SellerPass123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        customer1 = userRepository.save(User.builder()
                .firstName("Clara")
                .lastName("CustomerOne")
                .email("customer_rev1_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("CustomerPass123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        customer2 = userRepository.save(User.builder()
                .firstName("David")
                .lastName("CustomerTwo")
                .email("customer_rev2_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("CustomerPass123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Electronics " + System.nanoTime())
                .slug("electronics-" + System.nanoTime())
                .description("Electronic gadgets")
                .build());

        product1 = productRepository.save(Product.builder()
                .seller(seller1)
                .category(category)
                .name("Wireless Noise-Cancelling Headphones")
                .slug("wireless-headphones-" + System.nanoTime())
                .price(new BigDecimal("7999.00"))
                .stockQuantity(50)
                .status(Product.Status.APPROVED)
                .build());

        product2 = productRepository.save(Product.builder()
                .seller(seller2)
                .category(category)
                .name("Smart Fitness Band")
                .slug("smart-fitness-band-" + System.nanoTime())
                .price(new BigDecimal("2999.00"))
                .stockQuantity(30)
                .status(Product.Status.APPROVED)
                .build());

        customer1Address = addressRepository.save(Address.builder()
                .user(customer1)
                .label("Home")
                .fullName("Clara CustomerOne")
                .phone("9876543210")
                .line1("100 Innovation Park")
                .city("Bengaluru")
                .state("Karnataka")
                .postalCode("560001")
                .country("India")
                .isDefault(true)
                .build());

        customer2Address = addressRepository.save(Address.builder()
                .user(customer2)
                .label("Home")
                .fullName("David CustomerTwo")
                .phone("9123456780")
                .line1("200 Tech Hub")
                .city("Hyderabad")
                .state("Telangana")
                .postalCode("500081")
                .country("India")
                .isDefault(true)
                .build());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAsAdmin() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(admin, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
        );
    }

    private void authenticateAsSeller(User seller) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(seller, null, List.of(new SimpleGrantedAuthority("ROLE_SELLER")))
        );
    }

    private void authenticateAsCustomer(User customer) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(customer, null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")))
        );
    }

    private void createDeliveredOrderAndReview(User customer, Address address, Product product, int rating, String text) {
        authenticateAsCustomer(customer);
        cartService.addItem(customer.getId(), new CartItemRequest(product.getId(), 1));
        OrderResponse orderResponse = orderService.placeOrder(customer.getId(), new OrderRequest(address.getId(), null));

        // Advance to DELIVERED as admin
        authenticateAsAdmin();
        orderService.updateStatus(orderResponse.id(), OrderStatus.CONFIRMED, admin);
        orderService.updateStatus(orderResponse.id(), OrderStatus.PROCESSING, admin);
        orderService.updateStatus(orderResponse.id(), OrderStatus.SHIPPED, admin);
        orderService.updateStatus(orderResponse.id(), OrderStatus.DELIVERED, admin);

        // Submit review as customer
        authenticateAsCustomer(customer);
        reviewService.createReview(new CreateReviewRequest(product.getId(), rating, text), customer);
    }

    @Test
    @DisplayName("Admin can fetch platform-wide review metrics and listings across multiple sellers")
    void adminCanFetchPlatformWideReviews() {
        createDeliveredOrderAndReview(customer1, customer1Address, product1, 5, "Outstanding sound clarity and deep bass!");
        createDeliveredOrderAndReview(customer2, customer2Address, product2, 3, "Decent fitness band, battery lasts 2 days.");

        authenticateAsAdmin();
        var response = adminReviewController.getAdminReviews();
        assertThat(response).isNotNull();
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();

        AdminReviewSummaryResponse summary = response.getBody().getData();
        assertThat(summary).isNotNull();
        assertThat(summary.totalReviews()).isEqualTo(2);
        assertThat(summary.averageRating()).isEqualTo(4.0);
        assertThat(summary.rating5Count()).isEqualTo(1);
        assertThat(summary.rating3Count()).isEqualTo(1);
        assertThat(summary.rating4Count()).isEqualTo(0);
        assertThat(summary.reviews()).hasSize(2);
        assertThat(summary.reviews()).extracting("rating").containsExactlyInAnyOrder(5, 3);
    }

    @Test
    @DisplayName("Seller-scoped review query only returns seller's products, while Admin gets all")
    void sellerScopeVsAdminScope() {
        createDeliveredOrderAndReview(customer1, customer1Address, product1, 5, "Best wireless headset!");
        createDeliveredOrderAndReview(customer2, customer2Address, product2, 4, "Good fitness tracker.");

        // Seller 1 check
        authenticateAsSeller(seller1);
        SellerReviewSummaryResponse seller1Summary = reviewService.getSellerReviews(seller1.getId());
        assertThat(seller1Summary.totalReviews()).isEqualTo(1);
        assertThat(seller1Summary.averageRating()).isEqualTo(5.0);
        assertThat(seller1Summary.reviews()).hasSize(1);
        assertThat(seller1Summary.reviews().get(0).productId()).isEqualTo(product1.getId());

        // Admin check
        authenticateAsAdmin();
        var adminResponse = adminReviewController.getAdminReviews();
        AdminReviewSummaryResponse adminSummary = adminResponse.getBody().getData();
        assertThat(adminSummary.totalReviews()).isEqualTo(2);
        assertThat(adminSummary.averageRating()).isEqualTo(4.5);
    }

    @Test
    @DisplayName("Admin can moderate/delete any review across the platform")
    void adminCanDeleteAnyReview() {
        createDeliveredOrderAndReview(customer1, customer1Address, product1, 1, "Offensive inappropriate content that violates policy");

        authenticateAsAdmin();
        var adminResponse = adminReviewController.getAdminReviews();
        List<ReviewResponse> initialReviews = adminResponse.getBody().getData().reviews();
        assertThat(initialReviews).hasSize(1);
        Long reviewId = initialReviews.get(0).id();

        // Admin deletes the review
        var deleteResponse = adminReviewController.deleteReview(reviewId, admin);
        assertThat(deleteResponse.getStatusCode().is2xxSuccessful()).isTrue();

        // Verify review is deleted platform-wide
        var updatedResponse = adminReviewController.getAdminReviews();
        assertThat(updatedResponse.getBody().getData().totalReviews()).isEqualTo(0);
        assertThat(updatedResponse.getBody().getData().reviews()).isEmpty();
    }

    @Test
    @DisplayName("Non-admin role (Customer or Seller) is denied access to admin review endpoints")
    void nonAdminCannotAccessAdminReviewEndpoints() {
        authenticateAsCustomer(customer1);
        assertThatThrownBy(() -> adminReviewController.getAdminReviews())
                .isInstanceOf(AccessDeniedException.class);

        authenticateAsSeller(seller1);
        assertThatThrownBy(() -> adminReviewController.getAdminReviews())
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Unauthenticated request to admin review endpoints is denied")
    void unauthenticatedCannotAccessAdminReviewEndpoints() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> adminReviewController.getAdminReviews())
                .satisfies(e -> assertThat(e).isInstanceOfAny(AuthenticationException.class, AccessDeniedException.class));
    }
}
