package com.securecommerce.platform;

import com.securecommerce.platform.address.entity.Address;
import com.securecommerce.platform.address.repository.AddressRepository;
import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.service.CartService;
import com.securecommerce.platform.category.entity.Category;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.order.controller.AdminOrderController;
import com.securecommerce.platform.order.dto.*;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentMethod;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
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

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminOrderManagementIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private CartService cartService;
    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private AdminOrderController adminOrderController;
    @Autowired private PasswordEncoder passwordEncoder;

    private User admin;
    private User sellerA;
    private User sellerB;
    private User customer1;
    private User customer2;

    private Product productA1;
    private Product productB1;

    private Address customer1Address;
    private Address customer2Address;

    @BeforeEach
    void setUp() {
        String token = java.util.UUID.randomUUID().toString().replaceAll("[^a-zA-Z]", "").toLowerCase();

        admin = userRepository.save(User.builder()
                .firstName("Arthur")
                .lastName("Admin")
                .email("admin_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Admin123!"))
                .role(User.Role.ADMIN)
                .enabled(true)
                .build());

        sellerA = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("SellerA")
                .email("seller_alpha_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Seller123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        sellerB = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("SellerB")
                .email("seller_beta_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Seller123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        customer1 = userRepository.save(User.builder()
                .firstName("Charles")
                .lastName("CustomerOne")
                .email("customer_one_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Customer123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        customer2 = userRepository.save(User.builder()
                .firstName("Diana")
                .lastName("CustomerTwo")
                .email("customer_two_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Customer123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Appliances " + System.nanoTime())
                .slug("appliances-" + System.nanoTime())
                .description("Home & Kitchen Appliances")
                .build());

        productA1 = productRepository.save(Product.builder()
                .seller(sellerA)
                .category(category)
                .name("Coffee Maker Pro")
                .slug("coffee-maker-pro-" + System.nanoTime())
                .price(new BigDecimal("4500.00"))
                .stockQuantity(25)
                .status(Product.Status.APPROVED)
                .build());

        productB1 = productRepository.save(Product.builder()
                .seller(sellerB)
                .category(category)
                .name("Electric Kettle 1.5L")
                .slug("electric-kettle-" + System.nanoTime())
                .price(new BigDecimal("2200.00"))
                .stockQuantity(40)
                .status(Product.Status.APPROVED)
                .build());

        customer1Address = addressRepository.save(Address.builder()
                .user(customer1)
                .label("Home")
                .fullName("Charles CustomerOne")
                .phone("9876543210")
                .line1("42 Galaxy Way")
                .city("Bangalore")
                .state("Karnataka")
                .postalCode("560001")
                .country("India")
                .isDefault(true)
                .build());

        customer2Address = addressRepository.save(Address.builder()
                .user(customer2)
                .label("Office")
                .fullName("Diana CustomerTwo")
                .phone("9123456789")
                .line1("100 Corporate Boulevard")
                .city("Mumbai")
                .state("Maharashtra")
                .postalCode("400001")
                .country("India")
                .isDefault(true)
                .build());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
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

    private OrderResponse placeSingleSellerOrder(User customer, Address address) {
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 2));
        return orderService.placeOrder(customer.getId(), new OrderRequest(address.getId(), null));
    }

    private OrderResponse placeMixedSellerOrder(User customer, Address address) {
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 1));
        cartService.addItem(customer.getId(), new CartItemRequest(productB1.getId(), 2));
        return orderService.placeOrder(customer.getId(), new OrderRequest(address.getId(), null));
    }

    private Payment recordPayment(Long orderId, User customer, BigDecimal amount, PaymentStatus status) {
        var order = orderRepository.findById(orderId).orElseThrow();
        return paymentRepository.save(Payment.builder()
                .order(order)
                .customer(customer)
                .paymentMethod(PaymentMethod.CARD)
                .paymentStatus(status)
                .paymentGateway("SANDBOX_SECUREPAY")
                .transactionId("TXN-" + System.nanoTime())
                .amount(amount)
                .cardLast4("4242")
                .build());
    }

    @Test
    @DisplayName("Scenario 1: Admin can list all platform orders (paged)")
    void adminCanListAllPlatformOrdersPaged() {
        OrderResponse o1 = placeSingleSellerOrder(customer1, customer1Address);
        OrderResponse o2 = placeMixedSellerOrder(customer2, customer2Address);

        Page<AdminOrderListItemResponse> page =
                orderService.getAdminOrdersPaged(null, null, null, PageRequest.of(0, 10));

        assertThat(page).isNotNull();
        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(2);
        assertThat(page.getContent()).extracting("id").contains(o1.id(), o2.id());
    }

    @Test
    @DisplayName("Scenario 2: Admin can filter orders by status")
    void adminCanFilterOrdersByStatus() {
        OrderResponse o1 = placeSingleSellerOrder(customer1, customer1Address);
        OrderResponse o2 = placeMixedSellerOrder(customer2, customer2Address);

        // Advance o2 to CONFIRMED
        orderService.updateStatus(o2.id(), OrderStatus.CONFIRMED, admin);

        Page<AdminOrderListItemResponse> pendingPage =
                orderService.getAdminOrdersPaged(OrderStatus.PENDING, null, null, PageRequest.of(0, 10));
        assertThat(pendingPage.getContent()).extracting("id").contains(o1.id()).doesNotContain(o2.id());

        Page<AdminOrderListItemResponse> confirmedPage =
                orderService.getAdminOrdersPaged(OrderStatus.CONFIRMED, null, null, PageRequest.of(0, 10));
        assertThat(confirmedPage.getContent()).extracting("id").contains(o2.id()).doesNotContain(o1.id());
    }

    @Test
    @DisplayName("Scenario 3: Admin can filter orders by payment status")
    void adminCanFilterOrdersByPaymentStatus() {
        OrderResponse o1 = placeSingleSellerOrder(customer1, customer1Address);
        OrderResponse o2 = placeMixedSellerOrder(customer2, customer2Address);

        recordPayment(o1.id(), customer1, o1.totalAmount(), PaymentStatus.SUCCESS);
        recordPayment(o2.id(), customer2, o2.totalAmount(), PaymentStatus.INITIATED);

        Page<AdminOrderListItemResponse> paidPage =
                orderService.getAdminOrdersPaged(null, PaymentStatus.SUCCESS, null, PageRequest.of(0, 10));
        assertThat(paidPage.getContent()).extracting("id").contains(o1.id()).doesNotContain(o2.id());

        Page<AdminOrderListItemResponse> unpaidPage =
                orderService.getAdminOrdersPaged(null, PaymentStatus.INITIATED, null, PageRequest.of(0, 10));
        assertThat(unpaidPage.getContent()).extracting("id").contains(o2.id()).doesNotContain(o1.id());
    }

    @Test
    @DisplayName("Scenario 4: Admin can search orders by order ID")
    void adminCanSearchOrdersByOrderId() {
        OrderResponse o1 = placeSingleSellerOrder(customer1, customer1Address);
        OrderResponse o2 = placeMixedSellerOrder(customer2, customer2Address);

        Page<AdminOrderListItemResponse> result =
                orderService.getAdminOrdersPaged(null, null, o1.id().toString(), PageRequest.of(0, 10));
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).id()).isEqualTo(o1.id());
    }

    @Test
    @DisplayName("Scenario 5: Admin can search orders by customer name / email")
    void adminCanSearchOrdersByCustomerNameAndEmail() {
        OrderResponse o1 = placeSingleSellerOrder(customer1, customer1Address);
        OrderResponse o2 = placeMixedSellerOrder(customer2, customer2Address);

        // Search by customer 1's first name
        Page<AdminOrderListItemResponse> byName =
                orderService.getAdminOrdersPaged(null, null, "Charles", PageRequest.of(0, 10));
        assertThat(byName.getContent()).extracting("id").contains(o1.id()).doesNotContain(o2.id());

        // Search by customer 2's email
        Page<AdminOrderListItemResponse> byEmail =
                orderService.getAdminOrdersPaged(null, null, customer2.getEmail(), PageRequest.of(0, 10));
        assertThat(byEmail.getContent()).extracting("id").contains(o2.id()).doesNotContain(o1.id());
    }

    @Test
    @DisplayName("Scenario 6: Admin can view full order detail for single-seller order")
    void adminCanViewFullOrderDetailSingleSeller() {
        OrderResponse o1 = placeSingleSellerOrder(customer1, customer1Address);

        AdminOrderDetailResponse detail = orderService.getAdminOrderDetail(o1.id());

        assertThat(detail).isNotNull();
        assertThat(detail.id()).isEqualTo(o1.id());
        assertThat(detail.status()).isEqualTo(OrderStatus.PENDING);
        assertThat(detail.customerEmail()).isEqualTo(customer1.getEmail());
        assertThat(detail.customerName()).isEqualTo(customer1.getFirstName() + " " + customer1.getLastName());
        assertThat(detail.items()).hasSize(1);
        assertThat(detail.items().get(0).sellerId()).isEqualTo(sellerA.getId());
        assertThat(detail.sellerBreakdown()).hasSize(1);
    }

    @Test
    @DisplayName("Scenario 7: Admin can view full order detail for mixed-seller order")
    void adminCanViewFullOrderDetailMixedSeller() {
        OrderResponse o = placeMixedSellerOrder(customer1, customer1Address);

        AdminOrderDetailResponse detail = orderService.getAdminOrderDetail(o.id());

        assertThat(detail).isNotNull();
        assertThat(detail.items()).hasSize(2);
        assertThat(detail.items()).extracting("sellerId").containsExactlyInAnyOrder(sellerA.getId(), sellerB.getId());
    }

    @Test
    @DisplayName("Scenario 8: Admin detail view includes per-seller subtotal breakdown")
    void adminDetailIncludesPerSellerSubtotalBreakdown() {
        // ProductA1: 4500 * 1 = 4500 (Seller A)
        // ProductB1: 2200 * 2 = 4400 (Seller B)
        // Total = 8900
        OrderResponse o = placeMixedSellerOrder(customer1, customer1Address);

        AdminOrderDetailResponse detail = orderService.getAdminOrderDetail(o.id());

        assertThat(detail.sellerBreakdown()).hasSize(2);

        var sellerABreakdown = detail.sellerBreakdown().stream()
                .filter(b -> b.sellerId().equals(sellerA.getId()))
                .findFirst().orElseThrow();
        assertThat(sellerABreakdown.itemCount()).isEqualTo(1);
        assertThat(sellerABreakdown.subtotal()).isEqualByComparingTo("4500.00");

        var sellerBBreakdown = detail.sellerBreakdown().stream()
                .filter(b -> b.sellerId().equals(sellerB.getId()))
                .findFirst().orElseThrow();
        assertThat(sellerBBreakdown.itemCount()).isEqualTo(2);
        assertThat(sellerBBreakdown.subtotal()).isEqualByComparingTo("4400.00");

        // Platform customer total remains unchanged
        assertThat(detail.totalAmount()).isEqualByComparingTo("8900.00");
    }

    @Test
    @DisplayName("Scenario 9: Admin detail view includes shipping address snapshot")
    void adminDetailIncludesShippingAddressSnapshot() {
        OrderResponse o = placeSingleSellerOrder(customer1, customer1Address);

        AdminOrderDetailResponse detail = orderService.getAdminOrderDetail(o.id());

        assertThat(detail.shippingAddress()).isNotNull();
        assertThat(detail.shippingAddress().fullName()).isEqualTo("Charles CustomerOne");
        assertThat(detail.shippingAddress().line1()).isEqualTo("42 Galaxy Way");
        assertThat(detail.shippingAddress().city()).isEqualTo("Bangalore");
        assertThat(detail.shippingAddress().state()).isEqualTo("Karnataka");
        assertThat(detail.shippingAddress().postalCode()).isEqualTo("560001");
        assertThat(detail.shippingAddress().country()).isEqualTo("India");
        assertThat(detail.shippingAddress().phone()).isEqualTo("9876543210");
    }

    @Test
    @DisplayName("Scenario 10: Admin detail view includes payment audit trail")
    void adminDetailIncludesPaymentAudit() {
        OrderResponse o = placeSingleSellerOrder(customer1, customer1Address);
        Payment p = recordPayment(o.id(), customer1, o.totalAmount(), PaymentStatus.SUCCESS);

        AdminOrderDetailResponse detail = orderService.getAdminOrderDetail(o.id());

        assertThat(detail.payment()).isNotNull();
        var paymentDetail = detail.payment();
        assertThat(paymentDetail.transactionId()).isEqualTo(p.getTransactionId());
        assertThat(paymentDetail.paymentMethod()).isEqualTo(PaymentMethod.CARD);
        assertThat(paymentDetail.paymentGateway()).isEqualTo("SANDBOX_SECUREPAY");
        assertThat(paymentDetail.paymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(paymentDetail.cardLast4()).isEqualTo("4242");
    }

    @Test
    @DisplayName("Scenario 11: Admin can update order fulfillment status")
    void adminCanUpdateOrderFulfillmentStatus() {
        OrderResponse o = placeSingleSellerOrder(customer1, customer1Address);
        assertThat(o.status()).isEqualTo(OrderStatus.PENDING);

        // Advance to CONFIRMED
        OrderResponse r1 = orderService.updateStatus(o.id(), OrderStatus.CONFIRMED, admin);
        assertThat(r1.status()).isEqualTo(OrderStatus.CONFIRMED);

        // Advance to PROCESSING
        OrderResponse r2 = orderService.updateStatus(o.id(), OrderStatus.PROCESSING, admin);
        assertThat(r2.status()).isEqualTo(OrderStatus.PROCESSING);

        // Advance to SHIPPED
        OrderResponse r3 = orderService.updateStatus(o.id(), OrderStatus.SHIPPED, admin);
        assertThat(r3.status()).isEqualTo(OrderStatus.SHIPPED);

        // Advance to DELIVERED
        OrderResponse r4 = orderService.updateStatus(o.id(), OrderStatus.DELIVERED, admin);
        assertThat(r4.status()).isEqualTo(OrderStatus.DELIVERED);
    }

    @Test
    @DisplayName("Scenario 12: Admin can cancel an order with recorded reason")
    void adminCanCancelOrderWithRecordedReason() {
        // Stock initially: productA1 has 25 units. We order 2 units -> reserved -> stock becomes 23
        OrderResponse o = placeSingleSellerOrder(customer1, customer1Address);
        Product productBeforeCancel = productRepository.findById(productA1.getId()).orElseThrow();
        assertThat(productBeforeCancel.getStockQuantity()).isEqualTo(23);

        String reason = "Platform support cancellation: verified payment dispute";
        OrderResponse cancelled = orderService.cancelOrder(o.id(), reason, admin);

        assertThat(cancelled.status()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(cancelled.cancellationReason()).isEqualTo(reason);
        assertThat(cancelled.cancelledAt()).isNotNull();

        // Inventory is automatically returned to stock: 23 + 2 = 25
        Product productAfterCancel = productRepository.findById(productA1.getId()).orElseThrow();
        assertThat(productAfterCancel.getStockQuantity()).isEqualTo(25);
    }

    @Test
    @DisplayName("Scenario 13: Admin can retrieve platform order metrics")
    void adminCanRetrievePlatformOrderMetrics() {
        OrderResponse o1 = placeSingleSellerOrder(customer1, customer1Address);
        OrderResponse o2 = placeMixedSellerOrder(customer2, customer2Address);

        orderService.updateStatus(o2.id(), OrderStatus.CONFIRMED, admin);
        orderService.updateStatus(o2.id(), OrderStatus.PROCESSING, admin);
        orderService.updateStatus(o2.id(), OrderStatus.SHIPPED, admin);
        orderService.updateStatus(o2.id(), OrderStatus.DELIVERED, admin);

        AdminOrderSummaryMetricsResponse metrics = orderService.getAdminOrderMetrics();

        assertThat(metrics).isNotNull();
        assertThat(metrics.totalOrders()).isGreaterThanOrEqualTo(2);
        assertThat(metrics.pendingOrders()).isGreaterThanOrEqualTo(1);
        assertThat(metrics.deliveredOrders()).isGreaterThanOrEqualTo(1);
        assertThat(metrics.totalOrderValue()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Scenario 14: Seller cannot access admin order endpoints (403 Forbidden)")
    void sellerCannotAccessAdminOrderEndpoints() {
        OrderResponse o = placeSingleSellerOrder(customer1, customer1Address);
        authenticateAsSeller();

        assertThatThrownBy(() -> adminOrderController.getAdminOrders(null, null, null, 0, 10))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminOrderController.getAdminOrderDetail(o.id()))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminOrderController.getOrderMetrics())
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminOrderController.updateStatus(o.id(), new OrderStatusUpdateRequest(OrderStatus.CONFIRMED), sellerA))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminOrderController.cancelOrder(o.id(), new CancelOrderRequest("Seller cancel attempt"), sellerA))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Scenario 15: Customer cannot access admin order endpoints (403 Forbidden)")
    void customerCannotAccessAdminOrderEndpoints() {
        OrderResponse o = placeSingleSellerOrder(customer1, customer1Address);
        authenticateAsCustomer();

        assertThatThrownBy(() -> adminOrderController.getAdminOrders(null, null, null, 0, 10))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminOrderController.getAdminOrderDetail(o.id()))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> adminOrderController.getOrderMetrics())
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Scenario 16: Unauthenticated request to admin order endpoints returns 401 / Access Denied")
    void unauthenticatedCannotAccessAdminOrderEndpoints() {
        OrderResponse o = placeSingleSellerOrder(customer1, customer1Address);
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> adminOrderController.getAdminOrders(null, null, null, 0, 10))
                .satisfies(e -> assertThat(e).isInstanceOfAny(AuthenticationException.class, AccessDeniedException.class));

        assertThatThrownBy(() -> adminOrderController.getAdminOrderDetail(o.id()))
                .satisfies(e -> assertThat(e).isInstanceOfAny(AuthenticationException.class, AccessDeniedException.class));

        assertThatThrownBy(() -> adminOrderController.getOrderMetrics())
                .satisfies(e -> assertThat(e).isInstanceOfAny(AuthenticationException.class, AccessDeniedException.class));
    }
}
