package com.securecommerce.platform;

import com.securecommerce.platform.address.entity.Address;
import com.securecommerce.platform.address.repository.AddressRepository;
import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.service.CartService;
import com.securecommerce.platform.category.entity.Category;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.order.dto.OrderRequest;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.user.controller.AdminSellerController;
import com.securecommerce.platform.user.controller.AdminUserController;
import com.securecommerce.platform.user.dto.*;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import com.securecommerce.platform.user.service.AdminUserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminUserManagementIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private CartService cartService;
    @Autowired private OrderService orderService;
    @Autowired private AdminUserService adminUserService;
    @Autowired private AdminUserController adminUserController;
    @Autowired private AdminSellerController adminSellerController;
    @Autowired private PasswordEncoder passwordEncoder;

    private User admin;
    private User admin2;
    private User sellerA;
    private User sellerB;
    private User customer1;
    private User customer2;

    private Product productA1;
    private Product productA2;

    @BeforeEach
    void setUp() {
        String token = java.util.UUID.randomUUID().toString().replaceAll("[^a-zA-Z]", "").toLowerCase();

        admin = userRepository.save(User.builder()
                .firstName("Super")
                .lastName("Admin")
                .email("super_admin_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Admin123!"))
                .role(User.Role.ADMIN)
                .enabled(true)
                .build());

        admin2 = userRepository.save(User.builder()
                .firstName("Second")
                .lastName("Admin")
                .email("second_admin_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Admin123!"))
                .role(User.Role.ADMIN)
                .enabled(true)
                .build());

        sellerA = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Apex")
                .email("seller_apex_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Seller123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        sellerB = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("Beacon")
                .email("seller_beacon_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Seller123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        customer1 = userRepository.save(User.builder()
                .firstName("Chloe")
                .lastName("Customer")
                .email("customer_chloe_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Customer123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        customer2 = userRepository.save(User.builder()
                .firstName("David")
                .lastName("Delta")
                .email("customer_david_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Customer123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Electronics " + System.nanoTime())
                .slug("electronics-" + System.nanoTime())
                .description("Electronic Goods")
                .build());

        productA1 = productRepository.save(Product.builder()
                .seller(sellerA)
                .category(category)
                .name("Apex Headphones")
                .slug("apex-headphones-" + System.nanoTime())
                .price(new BigDecimal("1999.00"))
                .stockQuantity(15)
                .status(Product.Status.APPROVED)
                .build());

        productA2 = productRepository.save(Product.builder()
                .seller(sellerA)
                .category(category)
                .name("Apex Wireless Mouse")
                .slug("apex-wireless-mouse-" + System.nanoTime())
                .price(new BigDecimal("799.00"))
                .stockQuantity(30)
                .status(Product.Status.PENDING)
                .build());

        Address address = addressRepository.save(Address.builder()
                .user(customer1)
                .label("Home")
                .fullName("Chloe Customer")
                .phone("9876543210")
                .line1("100 Innovation Park")
                .city("Bangalore")
                .state("Karnataka")
                .postalCode("560100")
                .country("India")
                .isDefault(true)
                .build());

        cartService.addItem(customer1.getId(), new CartItemRequest(productA1.getId(), 1));
        orderService.placeOrder(customer1.getId(), new OrderRequest(address.getId(), null));

        authenticateAsAdmin();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAsAdmin() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(admin.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
        );
    }

    private void authenticateAsSeller() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(sellerA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SELLER")))
        );
    }

    private void authenticateAsCustomer() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(customer1.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")))
        );
    }

    @Test
    @DisplayName("Scenario 1: Admin can list users with pagination")
    void adminCanListUsers() {
        authenticateAsAdmin();
        Page<AdminUserListItemResponse> page = adminUserService.getUsersPaged(null, null, null, PageRequest.of(0, 10));

        assertThat(page).isNotNull();
        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(6);
        assertThat(page.getContent()).extracting(AdminUserListItemResponse::email)
                .contains(admin.getEmail(), sellerA.getEmail(), customer1.getEmail());
    }

    @Test
    @DisplayName("Scenario 2: Admin can search users by keyword")
    void adminCanSearchUsers() {
        authenticateAsAdmin();
        Page<AdminUserListItemResponse> page = adminUserService.getUsersPaged(null, null, "Apex", PageRequest.of(0, 10));

        assertThat(page).isNotNull();
        assertThat(page.getContent()).extracting(AdminUserListItemResponse::email)
                .contains(sellerA.getEmail())
                .doesNotContain(sellerB.getEmail(), customer1.getEmail());
    }

    @Test
    @DisplayName("Scenario 3: Admin can filter users by role")
    void adminCanFilterByRole() {
        authenticateAsAdmin();
        Page<AdminUserListItemResponse> sellers = adminUserService.getUsersPaged(User.Role.SELLER, null, null, PageRequest.of(0, 10));
        assertThat(sellers.getContent()).allMatch(u -> "SELLER".equals(u.role()));
        assertThat(sellers.getContent()).extracting(AdminUserListItemResponse::email)
                .contains(sellerA.getEmail(), sellerB.getEmail())
                .doesNotContain(customer1.getEmail(), admin.getEmail());

        Page<AdminUserListItemResponse> customers = adminUserService.getUsersPaged(User.Role.CUSTOMER, null, null, PageRequest.of(0, 10));
        assertThat(customers.getContent()).allMatch(u -> "CUSTOMER".equals(u.role()));
        assertThat(customers.getContent()).extracting(AdminUserListItemResponse::email)
                .contains(customer1.getEmail(), customer2.getEmail());
    }

    @Test
    @DisplayName("Scenario 4: Admin can access detailed user profile")
    void adminCanAccessUserDetails() {
        authenticateAsAdmin();
        AdminUserDetailResponse sellerDetail = adminUserService.getUserDetail(sellerA.getId());
        assertThat(sellerDetail).isNotNull();
        assertThat(sellerDetail.id()).isEqualTo(sellerA.getId());
        assertThat(sellerDetail.email()).isEqualTo(sellerA.getEmail());
        assertThat(sellerDetail.role()).isEqualTo("SELLER");
        assertThat(sellerDetail.status()).isEqualTo("ACTIVE");
        assertThat(sellerDetail.enabled()).isTrue();
        assertThat(sellerDetail.sellerInfo()).isNotNull();
        assertThat(sellerDetail.sellerInfo().totalProducts()).isEqualTo(2);

        AdminUserDetailResponse customerDetail = adminUserService.getUserDetail(customer1.getId());
        assertThat(customerDetail).isNotNull();
        assertThat(customerDetail.id()).isEqualTo(customer1.getId());
        assertThat(customerDetail.role()).isEqualTo("CUSTOMER");
        assertThat(customerDetail.customerInfo()).isNotNull();
        assertThat(customerDetail.customerInfo().totalOrders()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("Scenario 5: Admin can list sellers with catalog and order counts")
    void adminCanListSellers() {
        authenticateAsAdmin();
        Page<AdminSellerListItemResponse> sellers = adminUserService.getSellersPaged(null, null, PageRequest.of(0, 10));

        assertThat(sellers).isNotNull();
        assertThat(sellers.getContent()).extracting(AdminSellerListItemResponse::email)
                .contains(sellerA.getEmail(), sellerB.getEmail());

        AdminSellerListItemResponse itemA = sellers.getContent().stream()
                .filter(s -> s.id().equals(sellerA.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(itemA.totalProducts()).isEqualTo(2);
        assertThat(itemA.totalOrders()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("Scenario 6: Admin can access detailed seller platform overview")
    void adminCanAccessSellerDetails() {
        authenticateAsAdmin();
        AdminSellerDetailResponse detail = adminUserService.getSellerDetail(sellerA.getId());

        assertThat(detail).isNotNull();
        assertThat(detail.id()).isEqualTo(sellerA.getId());
        assertThat(detail.sellerName()).isEqualTo(sellerA.getFullName());
        assertThat(detail.totalProducts()).isEqualTo(2);
        assertThat(detail.approvedProducts()).isEqualTo(1);
        assertThat(detail.pendingProducts()).isEqualTo(1);
        assertThat(detail.totalOrders()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("Scenario 7: Admin can suspend seller")
    void adminCanSuspendSeller() {
        authenticateAsAdmin();
        AdminUserDetailResponse suspended = adminUserService.suspendUser(sellerA.getId(), admin);

        assertThat(suspended.enabled()).isFalse();
        assertThat(suspended.status()).isEqualTo("SUSPENDED");

        User reloaded = userRepository.findById(sellerA.getId()).orElseThrow();
        assertThat(reloaded.isEnabled()).isFalse();
    }

    @Test
    @DisplayName("Scenario 8: Admin can activate seller")
    void adminCanActivateSeller() {
        authenticateAsAdmin();
        adminUserService.suspendUser(sellerA.getId(), admin);

        AdminUserDetailResponse activated = adminUserService.activateUser(sellerA.getId(), admin);
        assertThat(activated.enabled()).isTrue();
        assertThat(activated.status()).isEqualTo("ACTIVE");

        User reloaded = userRepository.findById(sellerA.getId()).orElseThrow();
        assertThat(reloaded.isEnabled()).isTrue();
    }

    @Test
    @DisplayName("Scenario 9: Seller cannot access admin user and seller management APIs (403 Forbidden)")
    void sellerCannotAccessAdminUserApis() {
        authenticateAsSeller();

        assertThatThrownBy(() -> adminUserController.getUsers(null, null, null, null, 0, 10))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminUserController.getUserDetail(customer1.getId()))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminUserController.getUserMetrics())
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminSellerController.getSellers(null, null, null, 0, 10))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminSellerController.getSellerDetail(sellerA.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Scenario 10: Customer cannot access admin user and seller management APIs (403 Forbidden)")
    void customerCannotAccessAdminUserApis() {
        authenticateAsCustomer();

        assertThatThrownBy(() -> adminUserController.getUsers(null, null, null, null, 0, 10))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminUserController.getUserDetail(sellerA.getId()))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminUserController.getUserMetrics())
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminSellerController.getSellers(null, null, null, 0, 10))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Scenario 11: Unauthenticated caller is rejected (401 / Access Denied)")
    void unauthenticatedUserIsRejected() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> adminUserController.getUsers(null, null, null, null, 0, 10))
                .satisfies(e -> assertThat(e).isInstanceOfAny(AuthenticationException.class, AccessDeniedException.class));

        assertThatThrownBy(() -> adminSellerController.getSellers(null, null, null, 0, 10))
                .satisfies(e -> assertThat(e).isInstanceOfAny(AuthenticationException.class, AccessDeniedException.class));
    }

    @Test
    @DisplayName("Scenario 12: Seller cannot manipulate account status directly")
    void sellerCannotManipulateAccountStatusDirectly() {
        authenticateAsSeller();

        assertThatThrownBy(() -> adminUserController.suspendUser(customer1.getId(), sellerA))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminSellerController.suspendSeller(sellerB.getId(), sellerA))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminSellerController.activateSeller(sellerB.getId(), sellerA))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Scenario 13: Customer cannot manipulate account status directly")
    void customerCannotManipulateAccountStatusDirectly() {
        authenticateAsCustomer();

        assertThatThrownBy(() -> adminUserController.suspendUser(sellerA.getId(), customer1))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminSellerController.suspendSeller(sellerA.getId(), customer1))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Scenario 14: Admin cannot suspend self (400 Bad Request)")
    void adminCannotSuspendSelf() {
        authenticateAsAdmin();

        assertThatThrownBy(() -> adminUserService.suspendUser(admin.getId(), admin))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Administrators cannot suspend their own account");
    }

    @Test
    @DisplayName("Scenario 15: Last active admin cannot be disabled (400 Bad Request)")
    void lastActiveAdminCannotBeDisabled() {
        authenticateAsAdmin();

        // Suspend admin2 first (allowed since admin is still active)
        adminUserService.suspendUser(admin2.getId(), admin);

        // Now admin is the only active admin remaining
        // Attempting to suspend admin from another perspective must fail
        User tempActor = User.builder().id(999999L).role(User.Role.ADMIN).build();
        assertThatThrownBy(() -> adminUserService.suspendUser(admin.getId(), tempActor))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Cannot suspend the last active administrator account");
    }

    @Test
    @DisplayName("Scenario 16: Password hashes and private tokens are never exposed in user/seller DTOs")
    void passwordHashesAreNeverReturnedByDtos() {
        Class<?>[] dtos = {
                AdminUserListItemResponse.class,
                AdminUserDetailResponse.class,
                AdminSellerListItemResponse.class,
                AdminSellerDetailResponse.class,
                AdminUserSummaryMetricsResponse.class
        };

        for (Class<?> dtoClass : dtos) {
            Field[] fields = dtoClass.getDeclaredFields();
            for (Field field : fields) {
                String name = field.getName().toLowerCase();
                assertThat(name)
                        .withFailMessage("DTO " + dtoClass.getSimpleName() + " must not contain password or token fields: " + field.getName())
                        .doesNotContain("password")
                        .doesNotContain("secret")
                        .doesNotContain("hash");
            }
        }
    }

    @Test
    @DisplayName("Scenario 17: Admin can retrieve platform user ecosystem metrics")
    void adminCanRetrieveUserMetrics() {
        authenticateAsAdmin();
        AdminUserSummaryMetricsResponse metrics = adminUserService.getUserMetrics();

        assertThat(metrics).isNotNull();
        assertThat(metrics.totalUsers()).isGreaterThanOrEqualTo(6);
        assertThat(metrics.totalCustomers()).isGreaterThanOrEqualTo(2);
        assertThat(metrics.totalSellers()).isGreaterThanOrEqualTo(2);
        assertThat(metrics.activeSellers()).isGreaterThanOrEqualTo(2);
        assertThat(metrics.suspendedUsers()).isGreaterThanOrEqualTo(0);
    }

    @Test
    @DisplayName("Scenario 18: Admin can suspend and activate customer accounts")
    void adminCanSuspendAndActivateCustomer() {
        authenticateAsAdmin();

        AdminUserDetailResponse suspended = adminUserService.suspendUser(customer1.getId(), admin);
        assertThat(suspended.enabled()).isFalse();
        assertThat(suspended.status()).isEqualTo("SUSPENDED");

        User customerInDb = userRepository.findById(customer1.getId()).orElseThrow();
        assertThat(customerInDb.isEnabled()).isFalse();

        AdminUserDetailResponse activated = adminUserService.activateUser(customer1.getId(), admin);
        assertThat(activated.enabled()).isTrue();
        assertThat(activated.status()).isEqualTo("ACTIVE");

        customerInDb = userRepository.findById(customer1.getId()).orElseThrow();
        assertThat(customerInDb.isEnabled()).isTrue();
    }
}
