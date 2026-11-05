package com.securecommerce.platform;

import com.securecommerce.platform.address.entity.Address;
import com.securecommerce.platform.address.repository.AddressRepository;
import com.securecommerce.platform.auth.dto.AuthResponse;
import com.securecommerce.platform.auth.dto.LoginRequest;
import com.securecommerce.platform.auth.dto.RegisterRequest;
import com.securecommerce.platform.auth.exception.InvalidCredentialsException;
import com.securecommerce.platform.auth.service.AuthService;
import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.service.CartService;
import com.securecommerce.platform.category.entity.Category;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.event.controller.AdminEventController;
import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.entity.UserEvent;
import com.securecommerce.platform.event.repository.UserEventRepository;
import com.securecommerce.platform.event.service.EventLoggingService;
import com.securecommerce.platform.order.dto.OrderRequest;
import com.securecommerce.platform.order.dto.OrderResponse;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.payment.dto.CreateGatewayOrderRequest;
import com.securecommerce.platform.payment.dto.GatewayOrderDto;
import com.securecommerce.platform.payment.dto.VerifyPaymentRequest;
import com.securecommerce.platform.payment.gateway.MockPaymentGatewayService;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.payment.service.PaymentService;
import com.securecommerce.platform.product.controller.ProductController;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.returns.dto.CreateReturnRequest;
import com.securecommerce.platform.returns.entity.ReturnRequest;
import com.securecommerce.platform.returns.entity.ReturnStatus;
import com.securecommerce.platform.returns.repository.RefundRepository;
import com.securecommerce.platform.returns.repository.ReturnRequestRepository;
import com.securecommerce.platform.returns.service.ReturnService;
import com.securecommerce.platform.review.dto.CreateReviewRequest;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class EventLoggingIntegrationTest {

    @Autowired private AuthService authService;
    @Autowired private ProductController productController;
    @Autowired private CartService cartService;
    @Autowired private OrderService orderService;
    @Autowired private PaymentService paymentService;
    @Autowired private ReturnService returnService;
    @Autowired private ReviewService reviewService;
    @Autowired private EventLoggingService eventLoggingService;
    @Autowired private AdminEventController adminEventController;

    @Autowired private UserEventRepository userEventRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private ReturnRequestRepository returnRequestRepository;
    @Autowired private RefundRepository refundRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private MockPaymentGatewayService mockGatewayService;

    private User testCustomer;
    private User testSeller;
    private Product testProduct;
    private Address testAddress;
    private String uniqueSuffix;

    @BeforeEach
    void setUp() {
        userEventRepository.deleteAll();
        uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);

        testSeller = userRepository.save(User.builder()
                .email("seller_" + uniqueSuffix + "@shopivo.test")
                .passwordHash(passwordEncoder.encode("SellerPass123!"))
                .firstName("Test")
                .lastName("Seller")
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        testCustomer = userRepository.save(User.builder()
                .email("customer_" + uniqueSuffix + "@shopivo.test")
                .passwordHash(passwordEncoder.encode("CustomerPass123!"))
                .firstName("Test")
                .lastName("Customer")
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Electronics " + uniqueSuffix)
                .slug("electronics-" + uniqueSuffix)
                .description("Test Category")
                .build());

        testProduct = productRepository.save(Product.builder()
                .name("Smartphone Pro " + uniqueSuffix)
                .slug("smartphone-pro-" + uniqueSuffix)
                .description("Flagship phone")
                .price(new BigDecimal("9999.00"))
                .stockQuantity(50)
                .status(Product.Status.APPROVED)
                .category(category)
                .seller(testSeller)
                .build());

        testAddress = addressRepository.save(Address.builder()
                .user(testCustomer)
                .label("Home")
                .fullName("Test Customer")
                .phone("9876543210")
                .line1("123 Research Ave")
                .city("Bangalore")
                .state("Karnataka")
                .postalCode("560001")
                .country("India")
                .isDefault(true)
                .build());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private LoginRequest createLoginReq(String email, String password) {
        LoginRequest req = new LoginRequest();
        req.setEmail(email);
        req.setPassword(password);
        return req;
    }

    @Test
    @DisplayName("Verify REGISTRATION, LOGIN_SUCCESS, and LOGIN_FAILURE events")
    void testAuthEvents() {
        String regEmail = "new_user_" + uniqueSuffix + "@shopivo.test";
        RegisterRequest regReq = new RegisterRequest();
        regReq.setEmail(regEmail);
        regReq.setPassword("Password123!");
        regReq.setFirstName("New");
        regReq.setLastName("User");
        regReq.setRole(User.Role.CUSTOMER);

        AuthResponse registered = authService.register(regReq);
        assertThat(registered).isNotNull();

        List<UserEvent> regEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.REGISTRATION);
        assertThat(regEvents).anyMatch(e -> regEmail.equalsIgnoreCase(e.getUserEmail()));

        // 2. Successful Login
        AuthResponse loginSuccess = authService.login(createLoginReq(regEmail, "Password123!"));
        assertThat(loginSuccess).isNotNull();

        List<UserEvent> loginSuccessEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.LOGIN_SUCCESS);
        assertThat(loginSuccessEvents).anyMatch(e -> regEmail.equalsIgnoreCase(e.getUserEmail()));

        // 3. Failed Login (Wrong password)
        assertThatThrownBy(() -> authService.login(createLoginReq(regEmail, "WrongPassword!")))
                .isInstanceOf(InvalidCredentialsException.class);

        List<UserEvent> loginFailureEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.LOGIN_FAILURE);
        assertThat(loginFailureEvents).anyMatch(e -> e.getMetadata() != null && e.getMetadata().contains(regEmail));

        // 4. Failed Login (User not found)
        assertThatThrownBy(() -> authService.login(createLoginReq("nonexistent_" + uniqueSuffix + "@shopivo.test", "AnyPassword!")))
                .isInstanceOf(InvalidCredentialsException.class);

        List<UserEvent> allFailures = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.LOGIN_FAILURE);
        assertThat(allFailures).anyMatch(e -> e.getMetadata() != null && e.getMetadata().contains("USER_NOT_FOUND"));
    }

    @Test
    @DisplayName("Verify PRODUCT_VIEW and PRODUCT_SEARCH events")
    void testProductBehaviorEvents() {
        // Product view
        productController.getProductById(testProduct.getId(), testCustomer);
        List<UserEvent> viewEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.PRODUCT_VIEW);
        assertThat(viewEvents).anyMatch(e -> String.valueOf(testProduct.getId()).equals(e.getReferenceId()));

        // Product search
        productController.getProducts(0, 10, null, "Smartphone", testCustomer);
        List<UserEvent> searchEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.PRODUCT_SEARCH);
        assertThat(searchEvents).anyMatch(e -> e.getMetadata() != null && e.getMetadata().contains("Smartphone"));
    }

    @Test
    @DisplayName("Verify CART_ITEM_ADDED, CART_ITEM_UPDATED, CART_ITEM_REMOVED events")
    void testCartEvents() {
        // Add item
        cartService.addItem(testCustomer.getId(), new CartItemRequest(testProduct.getId(), 2));
        List<UserEvent> addEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.CART_ITEM_ADDED);
        assertThat(addEvents).anyMatch(e -> testCustomer.getId().equals(e.getUserId()));

        var cart = cartService.getCart(testCustomer.getId());
        Long itemId = cart.items().get(0).itemId();

        // Update quantity
        cartService.updateQuantity(testCustomer.getId(), itemId, 5);
        List<UserEvent> updateEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.CART_ITEM_UPDATED);
        assertThat(updateEvents).anyMatch(e -> String.valueOf(itemId).equals(e.getReferenceId()));

        // Remove item
        cartService.removeItem(testCustomer.getId(), itemId);
        List<UserEvent> removeEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.CART_ITEM_REMOVED);
        assertThat(removeEvents).anyMatch(e -> String.valueOf(itemId).equals(e.getReferenceId()));
    }

    @Test
    @DisplayName("Verify CHECKOUT_STARTED, ORDER_PLACED, and ORDER_CANCELLED events")
    void testOrderEvents() {
        cartService.addItem(testCustomer.getId(), new CartItemRequest(testProduct.getId(), 1));

        // Checkout Started
        orderService.recordCheckoutStarted(testCustomer.getId());
        List<UserEvent> checkoutEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.CHECKOUT_STARTED);
        assertThat(checkoutEvents).anyMatch(e -> testCustomer.getId().equals(e.getUserId()));

        // Order Placed
        OrderResponse placed = orderService.placeOrder(testCustomer.getId(), new OrderRequest(testAddress.getId(), null));
        assertThat(placed).isNotNull();

        List<UserEvent> orderPlacedEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.ORDER_PLACED);
        assertThat(orderPlacedEvents).anyMatch(e -> String.valueOf(placed.id()).equals(e.getReferenceId()));

        // Order Cancelled
        orderService.cancelOrder(placed.id(), "Customer changed mind", testCustomer);
        List<UserEvent> orderCancelledEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.ORDER_CANCELLED);
        assertThat(orderCancelledEvents).anyMatch(e -> String.valueOf(placed.id()).equals(e.getReferenceId()));
    }

    @Test
    @DisplayName("Verify PAYMENT_ATTEMPTED, PAYMENT_SUCCESS, and PAYMENT_FAILURE events")
    void testPaymentEvents() {
        cartService.addItem(testCustomer.getId(), new CartItemRequest(testProduct.getId(), 1));
        OrderResponse placed = orderService.placeOrder(testCustomer.getId(), new OrderRequest(testAddress.getId(), null));

        // 1. Payment Attempted
        GatewayOrderDto gwDto = paymentService.createGatewayOrder(testCustomer.getId(), new CreateGatewayOrderRequest(placed.id()));
        assertThat(gwDto).isNotNull();

        List<UserEvent> attemptedEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.PAYMENT_ATTEMPTED);
        assertThat(attemptedEvents).anyMatch(e -> String.valueOf(placed.id()).equals(e.getReferenceId()));

        // 2. Payment Failure (Invalid Signature)
        assertThatThrownBy(() -> paymentService.verifyGatewayPayment(testCustomer.getId(), new VerifyPaymentRequest(
                placed.id(),
                gwDto.gatewayOrderId(),
                "pay_mock_123",
                "invalid_signature"
        ))).isInstanceOf(ResponseStatusException.class);

        List<UserEvent> failureEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.PAYMENT_FAILURE);
        assertThat(failureEvents).anyMatch(e -> String.valueOf(placed.id()).equals(e.getReferenceId()) &&
                e.getMetadata().contains("SIGNATURE_VERIFICATION_FAILED"));

        // 3. Payment Success
        var successResponse = paymentService.verifyGatewayPayment(testCustomer.getId(), new VerifyPaymentRequest(
                placed.id(),
                gwDto.gatewayOrderId(),
                "pay_mock_success_123",
                "valid_test_signature"
        ));
        assertThat(successResponse).isNotNull();

        List<UserEvent> successEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.PAYMENT_SUCCESS);
        assertThat(successEvents).anyMatch(e -> String.valueOf(placed.id()).equals(e.getReferenceId()));
    }

    @Test
    @DisplayName("Verify RETURN_REQUESTED, REFUND_CREATED, and REVIEW_SUBMITTED events")
    void testReturnRefundReviewEvents() {
        cartService.addItem(testCustomer.getId(), new CartItemRequest(testProduct.getId(), 1));
        OrderResponse placed = orderService.placeOrder(testCustomer.getId(), new OrderRequest(testAddress.getId(), null));

        // Deliver order
        Order order = orderRepository.findById(placed.id()).orElseThrow();
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        // 1. Review Submitted
        var reviewResp = reviewService.createReview(new CreateReviewRequest(testProduct.getId(), 5, "Outstanding product!"), testCustomer);
        assertThat(reviewResp).isNotNull();

        List<UserEvent> reviewEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.REVIEW_SUBMITTED);
        assertThat(reviewEvents).anyMatch(e -> String.valueOf(reviewResp.id()).equals(e.getReferenceId()));

        // 2. Return Requested
        var returnResp = returnService.requestReturn(new CreateReturnRequest(placed.id(), null, "Defective item", "Screen flickering"), testCustomer);
        assertThat(returnResp).isNotNull();

        List<UserEvent> returnEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.RETURN_REQUESTED);
        assertThat(returnEvents).anyMatch(e -> String.valueOf(returnResp.id()).equals(e.getReferenceId()));

        // 3. Refund Created
        User adminUser = userRepository.save(User.builder()
                .email("admin_" + uniqueSuffix + "@shopivo.test")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .firstName("Admin")
                .lastName("Root")
                .role(User.Role.ADMIN)
                .enabled(true)
                .build());

        returnService.processAdminApproval(returnResp.id(), adminUser);
        List<UserEvent> refundEvents = userEventRepository.findByEventTypeOrderByEventTimestampDesc(EventType.REFUND_CREATED);
        assertThat(refundEvents).isNotEmpty();
    }

    @Test
    @DisplayName("Verify sensitive credentials and secrets are stripped/redacted from event metadata")
    void testSensitiveDataSanitization() {
        UserEvent event = eventLoggingService.logEvent(
                EventType.LOGIN_FAILURE,
                testCustomer.getId(),
                "SECURITY",
                "1",
                Map.of(
                        "password", "SecretPlainPassword123!",
                        "userToken", "jwt.token.here",
                        "cardCvv", "123",
                        "paymentSecret", "rzp_secret_key",
                        "safeEmail", "user@shopivo.test"
                )
        );

        assertThat(event).isNotNull();
        String metadata = event.getMetadata();
        assertThat(metadata).doesNotContain("SecretPlainPassword123!");
        assertThat(metadata).doesNotContain("jwt.token.here");
        assertThat(metadata).doesNotContain("rzp_secret_key");
        assertThat(metadata).contains("[REDACTED]");
        assertThat(metadata).contains("safeEmail");
    }

    @Test
    @DisplayName("Verify Admin CSV Export endpoint generates structured research CSV")
    void testAdminCsvExport() {
        User adminUser = userRepository.save(User.builder()
                .email("admin_export_" + uniqueSuffix + "@shopivo.test")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .firstName("Admin")
                .lastName("Export")
                .role(User.Role.ADMIN)
                .enabled(true)
                .build());

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(adminUser, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
        );

        eventLoggingService.logEvent(EventType.PRODUCT_VIEW, testCustomer.getId(), "PRODUCT", "1", Map.of("testKey", "testVal"));

        ResponseEntity<String> csvResponse = adminEventController.exportEventsCsv(null, null, null);
        assertThat(csvResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(csvResponse.getBody()).contains("id,user_id,user_email,event_type,event_timestamp");
        assertThat(csvResponse.getBody()).contains("PRODUCT_VIEW");

        ResponseEntity<String> ordersCsv = adminEventController.exportDataset("orders");
        assertThat(ordersCsv.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(ordersCsv.getBody()).contains("id,customer_id,status,total_amount");
    }
}
