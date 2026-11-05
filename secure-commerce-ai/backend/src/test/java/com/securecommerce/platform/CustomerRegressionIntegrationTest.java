package com.securecommerce.platform;

import com.securecommerce.platform.address.entity.Address;
import com.securecommerce.platform.address.repository.AddressRepository;
import com.securecommerce.platform.auth.dto.AuthResponse;
import com.securecommerce.platform.auth.dto.LoginRequest;
import com.securecommerce.platform.auth.dto.RegisterRequest;
import com.securecommerce.platform.auth.service.AuthService;
import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.dto.CartResponse;
import com.securecommerce.platform.cart.service.CartService;
import com.securecommerce.platform.category.entity.Category;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.coupon.dto.CouponValidationResponse;
import com.securecommerce.platform.coupon.entity.Coupon;
import com.securecommerce.platform.coupon.entity.DiscountType;
import com.securecommerce.platform.coupon.repository.CouponRepository;
import com.securecommerce.platform.coupon.service.CouponService;
import com.securecommerce.platform.notification.dto.NotificationResponse;
import com.securecommerce.platform.notification.entity.NotificationType;
import com.securecommerce.platform.notification.service.NotificationService;
import com.securecommerce.platform.order.dto.OrderRequest;
import com.securecommerce.platform.order.dto.OrderResponse;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.order.service.InvoiceService;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.payment.dto.PaymentResponse;
import com.securecommerce.platform.payment.dto.ProcessPaymentRequest;
import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentMethod;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.payment.service.PaymentService;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.returns.dto.CreateReturnRequest;
import com.securecommerce.platform.returns.dto.ReturnResponse;
import com.securecommerce.platform.returns.entity.ReturnStatus;
import com.securecommerce.platform.returns.repository.ReturnRequestRepository;
import com.securecommerce.platform.returns.service.ReturnService;
import com.securecommerce.platform.review.dto.CreateReviewRequest;
import com.securecommerce.platform.review.dto.ReviewResponse;
import com.securecommerce.platform.review.service.ReviewService;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import com.securecommerce.platform.wishlist.dto.WishlistResponse;
import com.securecommerce.platform.wishlist.service.WishlistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CustomerRegressionIntegrationTest {

    @Autowired private AuthService authService;
    @Autowired private CartService cartService;
    @Autowired private WishlistService wishlistService;
    @Autowired private CouponService couponService;
    @Autowired private OrderService orderService;
    @Autowired private PaymentService paymentService;
    @Autowired private ReviewService reviewService;
    @Autowired private ReturnService returnService;
    @Autowired private NotificationService notificationService;
    @Autowired private InvoiceService invoiceService;

    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private CouponRepository couponRepository;
    @Autowired private ReturnRequestRepository returnRequestRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private User seller;
    private User customerA;
    private User customerB;
    private Product laptopProduct;
    private Product mouseProduct;
    private Address addressA;
    private Coupon percentCoupon;
    private Coupon fixedCoupon;

    @BeforeEach
    void setupTestData() {
        // 1. Create Sellers & Customers
        seller = userRepository.save(User.builder()
                .email("seller.demo@example.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .firstName("Super")
                .lastName("Seller")
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        customerA = userRepository.save(User.builder()
                .email("customer.a@example.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .firstName("Alice")
                .lastName("Customer")
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        customerB = userRepository.save(User.builder()
                .email("customer.b@example.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .firstName("Bob")
                .lastName("Customer")
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        // 2. Create Category & Products
        Category category = categoryRepository.save(Category.builder()
                .name("Electronics")
                .slug("electronics")
                .description("Tech gear")
                .build());

        laptopProduct = productRepository.save(Product.builder()
                .name("Pro Laptop 15")
                .slug("pro-laptop-15")
                .description("High performance workstation")
                .price(new BigDecimal("1000.00"))
                .stockQuantity(20)
                .status(Product.Status.APPROVED)
                .seller(seller)
                .category(category)
                .build());

        mouseProduct = productRepository.save(Product.builder()
                .name("Wireless Optical Mouse")
                .slug("wireless-optical-mouse")
                .description("Ergonomic mouse")
                .price(new BigDecimal("500.00"))
                .stockQuantity(50)
                .status(Product.Status.APPROVED)
                .seller(seller)
                .category(category)
                .build());

        // 3. Create Shipping Address for Customer A
        addressA = addressRepository.save(Address.builder()
                .user(customerA)
                .label("Home")
                .fullName("Alice Customer")
                .phone("9876543210")
                .line1("123 Tech Park Avenue")
                .line2("Block B")
                .city("Bengaluru")
                .state("Karnataka")
                .postalCode("560001")
                .country("India")
                .isDefault(true)
                .build());

        // 4. Create Coupons
        percentCoupon = couponRepository.save(Coupon.builder()
                .code("SAVE10")
                .description("10% discount capped at 500")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00"))
                .minimumOrderAmount(new BigDecimal("500.00"))
                .maximumDiscountAmount(new BigDecimal("500.00"))
                .startAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .expiresAt(Instant.now().plus(30, ChronoUnit.DAYS))
                .usageLimit(100)
                .perCustomerLimit(1)
                .usedCount(0)
                .active(true)
                .build());

        fixedCoupon = couponRepository.save(Coupon.builder()
                .code("FLAT100")
                .description("Flat 100 off on orders above 400")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("100.00"))
                .minimumOrderAmount(new BigDecimal("400.00"))
                .startAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .expiresAt(Instant.now().plus(30, ChronoUnit.DAYS))
                .usageLimit(50)
                .perCustomerLimit(2)
                .usedCount(0)
                .active(true)
                .build());
    }

    @Test
    @DisplayName("Section 1: Authentication, Registration & Token Issuance")
    void testAuthLifecycle() {
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setEmail("charlie@example.com");
        registerReq.setPassword("Password123!");
        registerReq.setFirstName("Charlie");
        registerReq.setLastName("User");
        registerReq.setRole(User.Role.CUSTOMER);

        AuthResponse registerRes = authService.register(registerReq);
        assertThat(registerRes.getAccessToken()).isNotBlank();
        assertThat(registerRes.getUser().getEmail()).isEqualTo("charlie@example.com");

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("charlie@example.com");
        loginReq.setPassword("Password123!");

        AuthResponse loginRes = authService.login(loginReq);
        assertThat(loginRes.getAccessToken()).isNotBlank();

        LoginRequest badLogin = new LoginRequest();
        badLogin.setEmail("charlie@example.com");
        badLogin.setPassword("WrongPass123!");

        assertThatThrownBy(() -> authService.login(badLogin))
                .isInstanceOf(com.securecommerce.platform.auth.exception.InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("Section 4 & 5: Wishlist and Cart Isolation & Operations")
    void testWishlistAndCart() {
        // Add to Wishlist
        wishlistService.addItem(customerA.getId(), laptopProduct.getId());
        WishlistResponse wishlist = wishlistService.getWishlist(customerA.getId());
        assertThat(wishlist.items()).hasSize(1);
        assertThat(wishlist.items().get(0).product().name()).isEqualTo("Pro Laptop 15");

        // Customer B Wishlist remains empty (Isolation)
        WishlistResponse wishlistB = wishlistService.getWishlist(customerB.getId());
        assertThat(wishlistB.items()).isEmpty();

        // Cart Operations for Customer A
        cartService.addItem(customerA.getId(), new CartItemRequest(laptopProduct.getId(), 2));
        CartResponse cartA = cartService.getCart(customerA.getId());
        assertThat(cartA.totalItems()).isEqualTo(2);
        assertThat(cartA.subtotal()).isEqualByComparingTo("2000.00");

        // Customer B Cart remains empty (Isolation)
        CartResponse cartB = cartService.getCart(customerB.getId());
        assertThat(cartB.totalItems()).isEqualTo(0);
    }

    @Test
    @DisplayName("Section 7: Coupon Validation, Limits & Authoritative Calculation")
    void testCouponEngine() {
        // Customer A has 2000 in cart (2 laptops)
        cartService.addItem(customerA.getId(), new CartItemRequest(laptopProduct.getId(), 2));

        // 1. Valid Percentage Coupon
        CouponValidationResponse resPercent = couponService.validateCoupon("save10", customerA.getId());
        assertThat(resPercent.valid()).isTrue();
        assertThat(resPercent.code()).isEqualTo("SAVE10");
        assertThat(resPercent.discountAmount()).isEqualByComparingTo("200.00"); // 10% of 2000
        assertThat(resPercent.finalAmount()).isEqualByComparingTo("1800.00");

        // 2. Valid Fixed Coupon
        CouponValidationResponse resFixed = couponService.validateCoupon("flat100", customerA.getId());
        assertThat(resFixed.valid()).isTrue();
        assertThat(resFixed.discountAmount()).isEqualByComparingTo("100.00");
        assertThat(resFixed.finalAmount()).isEqualByComparingTo("1900.00");

        // 3. Minimum order not met (subtotal = 300, min = 500)
        CouponValidationResponse resMinNotMet = couponService.validateCouponForAmount("SAVE10", new BigDecimal("300.00"), customerA.getId());
        assertThat(resMinNotMet.valid()).isFalse();
        assertThat(resMinNotMet.message()).contains("Minimum order value");

        // 4. Non-existent coupon
        CouponValidationResponse resInvalid = couponService.validateCoupon("UNKNOWN99", customerA.getId());
        assertThat(resInvalid.valid()).isFalse();
    }

    @Test
    @DisplayName("Section 8, 9, 10: Complete Order Flow with Coupon, Snapshot, Stock & Sandbox Payment")
    void testCompleteOrderAndPaymentFlow() {
        int initialStock = laptopProduct.getStockQuantity(); // 20

        // 1. Add to cart: 1 Laptop (1000) + 1 Mouse (500) = Subtotal 1500
        cartService.addItem(customerA.getId(), new CartItemRequest(laptopProduct.getId(), 1));
        cartService.addItem(customerA.getId(), new CartItemRequest(mouseProduct.getId(), 1));

        // 2. Place Order with Coupon SAVE10 (10% of 1500 = 150 discount -> Total 1350)
        OrderRequest orderRequest = new OrderRequest(addressA.getId(), "SAVE10");
        OrderResponse orderRes = orderService.placeOrder(customerA.getId(), orderRequest);

        assertThat(orderRes.subtotalAmount()).isEqualByComparingTo("1500.00");
        assertThat(orderRes.discountAmount()).isEqualByComparingTo("150.00");
        assertThat(orderRes.couponCode()).isEqualTo("SAVE10");
        assertThat(orderRes.totalAmount()).isEqualByComparingTo("1350.00");
        assertThat(orderRes.status()).isEqualTo(OrderStatus.PENDING);

        // Verify Stock Decrement
        Product updatedLaptop = productRepository.findById(laptopProduct.getId()).orElseThrow();
        assertThat(updatedLaptop.getStockQuantity()).isEqualTo(initialStock - 1);

        // Verify Cart Cleared
        CartResponse cartAfter = cartService.getCart(customerA.getId());
        assertThat(cartAfter.totalItems()).isEqualTo(0);

        // Verify Coupon Usage Limit Enforced (SAVE10 has perCustomerLimit = 1)
        CouponValidationResponse reuseCheck = couponService.validateCouponForAmount("SAVE10", new BigDecimal("1000.00"), customerA.getId());
        assertThat(reuseCheck.valid()).isFalse();
        assertThat(reuseCheck.message()).contains("maximum usage limit");

        // 3. Process Gateway Online Payment via Razorpay
        com.securecommerce.platform.payment.dto.GatewayOrderDto gwOrder = paymentService.createGatewayOrder(
                customerA.getId(),
                new com.securecommerce.platform.payment.dto.CreateGatewayOrderRequest(orderRes.id())
        );
        PaymentResponse payment = paymentService.verifyGatewayPayment(
                customerA.getId(),
                new com.securecommerce.platform.payment.dto.VerifyPaymentRequest(
                        orderRes.id(),
                        gwOrder.gatewayOrderId(),
                        "pay_test_cust_a",
                        "valid_test_signature"
                )
        );
        assertThat(payment.paymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(payment.amount()).isEqualByComparingTo("1350.00"); // Matches order.totalAmount
        assertThat(payment.transactionId()).isNotBlank();

        // Verify Order is now CONFIRMED
        Order orderInDb = orderRepository.findById(orderRes.id()).orElseThrow();
        assertThat(orderInDb.getStatus()).isEqualTo(OrderStatus.CONFIRMED);

        // 4. Verify Invoice PDF Generation
        byte[] pdfBytes = invoiceService.generateInvoicePdf(orderRes.id(), customerA);
        assertThat(pdfBytes).isNotEmpty();
        assertThat(pdfBytes.length).isGreaterThan(100);

        // Cross-customer security on invoice
        assertThatThrownBy(() -> invoiceService.generateInvoicePdf(orderRes.id(), customerB))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("Section 11 & 16: Order Cancellation and Stock Restoration")
    void testOrderCancellationFlow() {
        int initialStock = mouseProduct.getStockQuantity();

        cartService.addItem(customerA.getId(), new CartItemRequest(mouseProduct.getId(), 3));
        OrderResponse order = orderService.placeOrder(customerA.getId(), new OrderRequest(addressA.getId(), null));

        // Stock is decremented by 3
        Product p = productRepository.findById(mouseProduct.getId()).orElseThrow();
        assertThat(p.getStockQuantity()).isEqualTo(initialStock - 3);

        // Cancel order
        OrderResponse cancelled = orderService.cancelOrder(order.id(), "Ordered by mistake", customerA);
        assertThat(cancelled.status()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(cancelled.cancellationReason()).isEqualTo("Ordered by mistake");

        // Stock is restored
        Product restoredP = productRepository.findById(mouseProduct.getId()).orElseThrow();
        assertThat(restoredP.getStockQuantity()).isEqualTo(initialStock);

        // Second cancellation attempt is rejected
        assertThatThrownBy(() -> orderService.cancelOrder(order.id(), "Cancel again", customerA))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("Section 13, 14, 15: Reviews, Returns & Refunds Post-Delivery Flow")
    void testPostDeliveryReturnAndReviewFlow() {
        // 1. Create and pay for an order
        cartService.addItem(customerA.getId(), new CartItemRequest(laptopProduct.getId(), 1));
        OrderResponse order = orderService.placeOrder(customerA.getId(), new OrderRequest(addressA.getId(), null));

        com.securecommerce.platform.payment.dto.GatewayOrderDto gwOrder = paymentService.createGatewayOrder(
                customerA.getId(),
                new com.securecommerce.platform.payment.dto.CreateGatewayOrderRequest(order.id())
        );
        PaymentResponse payment = paymentService.verifyGatewayPayment(
                customerA.getId(),
                new com.securecommerce.platform.payment.dto.VerifyPaymentRequest(
                        order.id(),
                        gwOrder.gatewayOrderId(),
                        "pay_test_cust_b",
                        "valid_test_signature"
                )
        );
        assertThat(payment.paymentStatus()).isEqualTo(PaymentStatus.SUCCESS);

        // 2. Pre-delivery: review should be rejected
        assertThatThrownBy(() -> reviewService.createReview(new CreateReviewRequest(laptopProduct.getId(), 5, "Great product!"), customerA))
                .isInstanceOf(ResponseStatusException.class);

        // Pre-delivery: return should be rejected
        assertThatThrownBy(() -> returnService.requestReturn(new CreateReturnRequest(order.id(), null, "Defective", null), customerA))
                .isInstanceOf(ResponseStatusException.class);

        // 3. Mark Order as DELIVERED
        Order orderEntity = orderRepository.findById(order.id()).orElseThrow();
        orderEntity.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(orderEntity);

        // 4. Verified Review Creation
        ReviewResponse review = reviewService.createReview(
                new CreateReviewRequest(laptopProduct.getId(), 5, "Awesome Laptop, super fast!"),
                customerA
        );
        assertThat(review.rating()).isEqualTo(5);
        assertThat(review.verifiedPurchase()).isTrue();

        // Duplicate review rejected
        assertThatThrownBy(() -> reviewService.createReview(new CreateReviewRequest(laptopProduct.getId(), 4, "Another review"), customerA))
                .isInstanceOf(ResponseStatusException.class);

        // 5. Customer Requests Return
        ReturnResponse returnRes = returnService.requestReturn(
                new CreateReturnRequest(order.id(), null, "Damaged or defective product", "Screen flicker issue"),
                customerA
        );
        assertThat(returnRes.status()).isEqualTo("REQUESTED");
        assertThat(returnRes.refundAmount()).isEqualByComparingTo("1000.00");

        // 6. Simulate Sandbox Approval and Refund Process
        ReturnResponse processedReturn = returnService.processSandboxApproval(returnRes.id(), customerA);
        assertThat(processedReturn.status()).isEqualTo("COMPLETED");
        assertThat(processedReturn.refundAmount()).isEqualByComparingTo("1000.00");

        // Payment status is transitioned to REFUNDED
        Payment updatedPayment = paymentRepository.findByOrderId(order.id()).orElseThrow();
        assertThat(updatedPayment.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
    }

    @Test
    @DisplayName("Section 18: Notification Center Lifecycle")
    void testNotificationLifecycle() {
        notificationService.createNotification(
                customerA,
                NotificationType.ORDER_PLACED,
                "Order Placed",
                "Your order #1 has been placed.",
                "ORDER",
                1L
        );

        List<NotificationResponse> notifications = notificationService.getMyNotifications(customerA);
        long unreadCount = notificationService.getUnreadCount(customerA);
        assertThat(unreadCount).isEqualTo(1);
        assertThat(notifications).hasSize(1);

        Long notifId = notifications.get(0).id();
        notificationService.markAsRead(notifId, customerA);

        long unreadAfter = notificationService.getUnreadCount(customerA);
        assertThat(unreadAfter).isEqualTo(0);

        // Customer B cannot mark Customer A's notification as read
        assertThatThrownBy(() -> notificationService.markAsRead(notifId, customerB))
                .isInstanceOf(ResponseStatusException.class);
    }
}
