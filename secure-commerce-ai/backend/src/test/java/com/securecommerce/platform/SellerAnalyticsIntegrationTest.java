package com.securecommerce.platform;

import com.securecommerce.platform.address.entity.Address;
import com.securecommerce.platform.address.repository.AddressRepository;
import com.securecommerce.platform.analytics.controller.SellerAnalyticsController;
import com.securecommerce.platform.analytics.dto.DailySalesPoint;
import com.securecommerce.platform.analytics.dto.SellerAnalyticsSummaryResponse;
import com.securecommerce.platform.analytics.dto.TopSellingProductResponse;
import com.securecommerce.platform.analytics.service.SellerAnalyticsService;
import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.service.CartService;
import com.securecommerce.platform.category.entity.Category;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.order.dto.OrderRequest;
import com.securecommerce.platform.order.dto.OrderResponse;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentMethod;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.returns.entity.Refund;
import com.securecommerce.platform.returns.entity.RefundStatus;
import com.securecommerce.platform.returns.entity.ReturnRequest;
import com.securecommerce.platform.returns.entity.ReturnStatus;
import com.securecommerce.platform.returns.repository.RefundRepository;
import com.securecommerce.platform.returns.repository.ReturnRequestRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class SellerAnalyticsIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private CartService cartService;
    @Autowired private OrderService orderService;
    @Autowired private SellerAnalyticsService sellerAnalyticsService;
    @Autowired private SellerAnalyticsController sellerAnalyticsController;
    @Autowired private ReturnRequestRepository returnRequestRepository;
    @Autowired private RefundRepository refundRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private User sellerA;
    private User sellerB;
    private User sellerC;
    private User customer;
    private Product productA1;
    private Product productA2;
    private Product productB1;
    private Address customerAddress;

    @BeforeEach
    void setUp() {
        sellerA = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("SellerA")
                .email("seller_a_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        sellerB = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("SellerB")
                .email("seller_b_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        sellerC = userRepository.save(User.builder()
                .firstName("Charlie")
                .lastName("SellerC")
                .email("seller_c_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        customer = userRepository.save(User.builder()
                .firstName("David")
                .lastName("Customer")
                .email("customer_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Appliances " + System.nanoTime())
                .slug("appliances-" + System.nanoTime())
                .description("Home & Kitchen")
                .build());

        productA1 = productRepository.save(Product.builder()
                .seller(sellerA)
                .category(category)
                .name("Seller A Espresso Machine")
                .slug("seller-a-espresso-" + System.nanoTime())
                .price(new BigDecimal("10000.00"))
                .stockQuantity(15)
                .status(Product.Status.APPROVED)
                .build());

        productA2 = productRepository.save(Product.builder()
                .seller(sellerA)
                .category(category)
                .name("Seller A Coffee Grinder")
                .slug("seller-a-grinder-" + System.nanoTime())
                .price(new BigDecimal("2500.00"))
                .stockQuantity(40)
                .status(Product.Status.APPROVED)
                .build());

        productB1 = productRepository.save(Product.builder()
                .seller(sellerB)
                .category(category)
                .name("Seller B Milk Frother")
                .slug("seller-b-frother-" + System.nanoTime())
                .price(new BigDecimal("5000.00"))
                .stockQuantity(25)
                .status(Product.Status.APPROVED)
                .build());

        customerAddress = addressRepository.save(Address.builder()
                .user(customer)
                .label("Home")
                .fullName("David Customer")
                .phone("9876543210")
                .line1("456 Coffee Ave")
                .city("Seattle")
                .state("WA")
                .postalCode("98101")
                .country("USA")
                .isDefault(true)
                .build());
    }

    @Test
    @DisplayName("Seller isolation & mixed-seller order: Seller A and Seller B calculate only their respective sales")
    void sellerIsolationAndMixedOrderAggregation() {
        // Customer orders 1x Product A1 (₹10,000), 2x Product A2 (₹5,000), 1x Product B1 (₹5,000)
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 1));
        cartService.addItem(customer.getId(), new CartItemRequest(productA2.getId(), 2));
        cartService.addItem(customer.getId(), new CartItemRequest(productB1.getId(), 1));

        OrderResponse order = orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));
        assertThat(order).isNotNull();

        // 1. Check Seller A summary
        SellerAnalyticsSummaryResponse summaryA = sellerAnalyticsService.getSummary(sellerA.getId(), "all");
        assertThat(summaryA.totalOrders()).isEqualTo(1);
        assertThat(summaryA.completedOrders()).isEqualTo(0);
        assertThat(summaryA.cancelledOrders()).isEqualTo(0);
        assertThat(summaryA.unitsSold()).isEqualTo(3); // 1 + 2 = 3
        assertThat(summaryA.grossSales()).isEqualByComparingTo("15000.00"); // 10000 + 5000 = 15000
        assertThat(summaryA.refundedAmount()).isEqualByComparingTo("0.00");

        // 2. Check Seller B summary
        SellerAnalyticsSummaryResponse summaryB = sellerAnalyticsService.getSummary(sellerB.getId(), "all");
        assertThat(summaryB.totalOrders()).isEqualTo(1);
        assertThat(summaryB.completedOrders()).isEqualTo(0);
        assertThat(summaryB.cancelledOrders()).isEqualTo(0);
        assertThat(summaryB.unitsSold()).isEqualTo(1);
        assertThat(summaryB.grossSales()).isEqualByComparingTo("5000.00");
        assertThat(summaryB.refundedAmount()).isEqualByComparingTo("0.00");

        // 3. Check Seller C summary (no items in any order)
        SellerAnalyticsSummaryResponse summaryC = sellerAnalyticsService.getSummary(sellerC.getId(), "all");
        assertThat(summaryC.totalOrders()).isEqualTo(0);
        assertThat(summaryC.completedOrders()).isEqualTo(0);
        assertThat(summaryC.cancelledOrders()).isEqualTo(0);
        assertThat(summaryC.unitsSold()).isEqualTo(0);
        assertThat(summaryC.grossSales()).isEqualByComparingTo("0.00");
        assertThat(summaryC.refundedAmount()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("Cancelled orders: Cancelled orders are excluded from sales and units sold, but recorded in cancelledOrders")
    void cancelledOrders_excludedFromGrossSalesAndUnits() {
        // Customer places order for Seller A (1x Product A1 = ₹10,000)
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 1));
        OrderResponse order1 = orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));

        // Customer places second order for Seller A (1x Product A2 = ₹2,500)
        cartService.addItem(customer.getId(), new CartItemRequest(productA2.getId(), 1));
        OrderResponse order2 = orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));

        // Customer cancels order2
        orderService.cancelOrder(order2.id(), "Changed mind", customer);

        SellerAnalyticsSummaryResponse summaryA = sellerAnalyticsService.getSummary(sellerA.getId(), "all");
        assertThat(summaryA.totalOrders()).isEqualTo(2);
        assertThat(summaryA.cancelledOrders()).isEqualTo(1);
        assertThat(summaryA.unitsSold()).isEqualTo(1); // Only order1 items
        assertThat(summaryA.grossSales()).isEqualByComparingTo("10000.00"); // Only order1 lineTotal
    }

    @Test
    @DisplayName("Completed orders: Only DELIVERED orders count towards completedOrders")
    void completedOrders_countsDeliveredOrders() {
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 1));
        OrderResponse order = orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));

        // Before delivery: completed = 0
        SellerAnalyticsSummaryResponse beforeDelivery = sellerAnalyticsService.getSummary(sellerA.getId(), "all");
        assertThat(beforeDelivery.completedOrders()).isEqualTo(0);

        // Advance to CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
        orderService.updateStatus(order.id(), OrderStatus.CONFIRMED, sellerA);
        orderService.updateStatus(order.id(), OrderStatus.PROCESSING, sellerA);
        orderService.updateStatus(order.id(), OrderStatus.SHIPPED, sellerA);
        orderService.updateStatus(order.id(), OrderStatus.DELIVERED, sellerA);

        // After delivery: completed = 1
        SellerAnalyticsSummaryResponse afterDelivery = sellerAnalyticsService.getSummary(sellerA.getId(), "all");
        assertThat(afterDelivery.completedOrders()).isEqualTo(1);
        assertThat(afterDelivery.grossSales()).isEqualByComparingTo("10000.00");
    }

    @Test
    @DisplayName("Top products: Correctly ranked by actual sold quantities with seller isolation")
    void topProducts_rankedByUnitsSoldWithSellerIsolation() {
        // Customer buys 1x A1 and 3x A2
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 1));
        cartService.addItem(customer.getId(), new CartItemRequest(productA2.getId(), 3));
        orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));

        List<TopSellingProductResponse> topA = sellerAnalyticsService.getTopProducts(sellerA.getId(), "all", 5);
        assertThat(topA).hasSize(2);

        // Product A2 has 3 units sold -> rank #1
        assertThat(topA.get(0).productId()).isEqualTo(productA2.getId());
        assertThat(topA.get(0).productName()).isEqualTo("Seller A Coffee Grinder");
        assertThat(topA.get(0).unitsSold()).isEqualTo(3);
        assertThat(topA.get(0).grossSales()).isEqualByComparingTo("7500.00");

        // Product A1 has 1 unit sold -> rank #2
        assertThat(topA.get(1).productId()).isEqualTo(productA1.getId());
        assertThat(topA.get(1).unitsSold()).isEqualTo(1);
        assertThat(topA.get(1).grossSales()).isEqualByComparingTo("10000.00");

        // Product B1 must NOT appear in Seller A's top products
        assertThat(topA).noneMatch(p -> p.productId().equals(productB1.getId()));
    }

    @Test
    @DisplayName("Daily sales trend: Continuous date series generated for 7d with correct sales and zero-filling")
    void salesTrend_generatesContinuousPoints() {
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 2));
        orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));

        List<DailySalesPoint> trend7d = sellerAnalyticsService.getSalesTrend(sellerA.getId(), "7d");
        assertThat(trend7d).hasSize(7); // Exactly 7 days

        // Total sales across the 7 days should sum to 20,000 and units = 2
        BigDecimal totalTrendSales = trend7d.stream()
                .map(DailySalesPoint::sales)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalTrendUnits = trend7d.stream()
                .mapToLong(DailySalesPoint::units)
                .sum();

        assertThat(totalTrendSales).isEqualByComparingTo("20000.00");
        assertThat(totalTrendUnits).isEqualTo(2);
    }

    @Test
    @DisplayName("Refund tracking: Completed refund amount is recorded in summary")
    void refundTracking_completedRefundRecordedInSummary() {
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 1));
        OrderResponse placedOrder = orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));

        // Advance to DELIVERED
        orderService.updateStatus(placedOrder.id(), OrderStatus.CONFIRMED, sellerA);
        orderService.updateStatus(placedOrder.id(), OrderStatus.PROCESSING, sellerA);
        orderService.updateStatus(placedOrder.id(), OrderStatus.SHIPPED, sellerA);
        orderService.updateStatus(placedOrder.id(), OrderStatus.DELIVERED, sellerA);

        com.securecommerce.platform.order.entity.OrderItem targetItem = placedOrder.items().stream()
                .filter(i -> i.sellerId().equals(sellerA.getId()))
                .map(i -> com.securecommerce.platform.order.entity.OrderItem.builder()
                        .id(i.id())
                        .seller(sellerA)
                        .product(productA1)
                        .productNameSnapshot(productA1.getName())
                        .priceSnapshot(productA1.getPrice())
                        .quantity(1)
                        .lineTotal(new BigDecimal("10000.00"))
                        .build())
                .findFirst().orElseThrow();

        // Create return request and refund directly
        com.securecommerce.platform.order.entity.Order managedOrder = com.securecommerce.platform.order.entity.Order.builder()
                .id(placedOrder.id())
                .customer(customer)
                .shippingFullName(customer.getFirstName())
                .shippingPhone("9876543210")
                .shippingLine1("456 Coffee Ave")
                .shippingCity("Seattle")
                .shippingState("WA")
                .shippingPostalCode("98101")
                .shippingCountry("USA")
                .totalAmount(new BigDecimal("10000.00"))
                .build();

        ReturnRequest returnRequest = returnRequestRepository.save(ReturnRequest.builder()
                .order(managedOrder)
                .customer(customer)
                .orderItem(targetItem)
                .reason("Defective")
                .status(ReturnStatus.COMPLETED)
                .refundAmount(new BigDecimal("10000.00"))
                .completedAt(Instant.now())
                .build());

        refundRepository.save(Refund.builder()
                .returnRequest(returnRequest)
                .order(managedOrder)
                .customer(customer)
                .refundAmount(new BigDecimal("10000.00"))
                .refundStatus(RefundStatus.SUCCESS)
                .refundTransactionId("TEST-REFUND-" + UUID.randomUUID())
                .paymentMethod(PaymentMethod.COD)
                .processedAt(Instant.now())
                .build());

        SellerAnalyticsSummaryResponse summaryA = sellerAnalyticsService.getSummary(sellerA.getId(), "all");
        assertThat(summaryA.refundedAmount()).isEqualByComparingTo("10000.00");
    }

    @Test
    @DisplayName("Controller endpoint scoping & role protection: Authenticated seller gets data; Customer is denied")
    void controllerEndpoints_useAuthenticatedSellerContextAndRoleProtection() {
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 1));
        orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));

        // 1. When Seller A invokes controller with Seller A authentication
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken authA =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        sellerA, null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + sellerA.getRole().name())));
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authA);
        try {
            ResponseEntity<ApiResponse<SellerAnalyticsSummaryResponse>> responseA =
                    sellerAnalyticsController.getSummary("all", sellerA);
            assertThat(responseA.getStatusCode().is2xxSuccessful()).isTrue();
            assertThat(responseA.getBody().getData().grossSales()).isEqualByComparingTo("10000.00");
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }

        // 2. When Seller B invokes controller with Seller B authentication
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken authB =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        sellerB, null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + sellerB.getRole().name())));
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authB);
        try {
            ResponseEntity<ApiResponse<SellerAnalyticsSummaryResponse>> responseB =
                    sellerAnalyticsController.getSummary("all", sellerB);
            assertThat(responseB.getStatusCode().is2xxSuccessful()).isTrue();
            assertThat(responseB.getBody().getData().grossSales()).isEqualByComparingTo("0.00");
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }

        // 3. When Customer invokes seller controller -> AccessDeniedException thrown by @PreAuthorize
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken authCustomer =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        customer, null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + customer.getRole().name())));
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authCustomer);
        try {
            org.assertj.core.api.Assertions.assertThatThrownBy(() -> sellerAnalyticsController.getSummary("all", customer))
                    .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }
}
