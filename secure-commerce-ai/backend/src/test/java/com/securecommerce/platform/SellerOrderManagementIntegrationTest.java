package com.securecommerce.platform;

import com.securecommerce.platform.address.entity.Address;
import com.securecommerce.platform.address.repository.AddressRepository;
import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.service.CartService;
import com.securecommerce.platform.category.entity.Category;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.notification.dto.NotificationResponse;
import com.securecommerce.platform.notification.entity.NotificationType;
import com.securecommerce.platform.notification.service.NotificationService;
import com.securecommerce.platform.order.dto.OrderRequest;
import com.securecommerce.platform.order.dto.OrderResponse;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class SellerOrderManagementIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private CartService cartService;
    @Autowired private OrderService orderService;
    @Autowired private NotificationService notificationService;
    @Autowired private PasswordEncoder passwordEncoder;

    private User sellerA;
    private User sellerB;
    private User sellerC;
    private User customer;
    private Product productA1;
    private Product productA2;
    private Product productB;
    private Address customerAddress;

    @BeforeEach
    void setUp() {
        // Create 2 active sellers and 1 unrelated seller
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

        // Create customer
        customer = userRepository.save(User.builder()
                .firstName("David")
                .lastName("Customer")
                .email("cust_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        // Category
        Category category = categoryRepository.save(Category.builder()
                .name("Electronics " + System.nanoTime())
                .slug("electronics-" + System.nanoTime())
                .description("Gadgets & Devices")
                .build());

        // Products for Seller A
        productA1 = productRepository.save(Product.builder()
                .seller(sellerA)
                .category(category)
                .name("Seller A Laptop")
                .slug("seller-a-laptop-" + System.nanoTime())
                .price(new BigDecimal("50000.00"))
                .stockQuantity(20)
                .status(Product.Status.APPROVED)
                .build());

        productA2 = productRepository.save(Product.builder()
                .seller(sellerA)
                .category(category)
                .name("Seller A Mouse")
                .slug("seller-a-mouse-" + System.nanoTime())
                .price(new BigDecimal("1500.00"))
                .stockQuantity(50)
                .status(Product.Status.APPROVED)
                .build());

        // Product for Seller B
        productB = productRepository.save(Product.builder()
                .seller(sellerB)
                .category(category)
                .name("Seller B Mechanical Keyboard")
                .slug("seller-b-keyboard-" + System.nanoTime())
                .price(new BigDecimal("4000.00"))
                .stockQuantity(30)
                .status(Product.Status.APPROVED)
                .build());

        // Shipping address
        customerAddress = addressRepository.save(Address.builder()
                .user(customer)
                .label("Home")
                .fullName("David Customer")
                .phone("9876543210")
                .line1("123 Tech Park")
                .city("Bangalore")
                .state("Karnataka")
                .postalCode("560001")
                .country("India")
                .isDefault(true)
                .build());
    }

    @Test
    @DisplayName("Mixed-seller order: Seller A sees only A's items and Seller B sees only B's items")
    void mixedSellerOrder_itemSegregationAndTotalsEnforced() {
        // Customer adds items from Seller A (productA1, productA2) and Seller B (productB)
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 1));
        cartService.addItem(customer.getId(), new CartItemRequest(productA2.getId(), 2));
        cartService.addItem(customer.getId(), new CartItemRequest(productB.getId(), 1));

        // Customer places order
        OrderResponse placedOrder = orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));
        assertThat(placedOrder).isNotNull();
        assertThat(placedOrder.items()).hasSize(3);

        // 1. Seller A checks order list
        List<OrderResponse> sellerAOrders = orderService.getSellerOrders(sellerA.getId());
        assertThat(sellerAOrders).isNotEmpty();
        OrderResponse sellerAOrderView = sellerAOrders.stream()
                .filter(o -> o.id().equals(placedOrder.id()))
                .findFirst()
                .orElseThrow();

        // Seller A should see only their 2 items (Laptop + Mouse)
        assertThat(sellerAOrderView.items()).hasSize(2);
        assertThat(sellerAOrderView.items())
                .allMatch(item -> item.sellerId().equals(sellerA.getId()));
        // Total items for Seller A = 1 + 2 = 3
        assertThat(sellerAOrderView.totalItems()).isEqualTo(3);
        // Subtotal for Seller A = 50000 + (1500 * 2) = 53000
        assertThat(sellerAOrderView.subtotalAmount()).isEqualByComparingTo("53000.00");
        assertThat(sellerAOrderView.totalAmount()).isEqualByComparingTo("53000.00");

        // 2. Seller B checks order list
        List<OrderResponse> sellerBOrders = orderService.getSellerOrders(sellerB.getId());
        assertThat(sellerBOrders).isNotEmpty();
        OrderResponse sellerBOrderView = sellerBOrders.stream()
                .filter(o -> o.id().equals(placedOrder.id()))
                .findFirst()
                .orElseThrow();

        // Seller B should see only their 1 item (Keyboard)
        assertThat(sellerBOrderView.items()).hasSize(1);
        assertThat(sellerBOrderView.items().get(0).sellerId()).isEqualTo(sellerB.getId());
        assertThat(sellerBOrderView.items().get(0).productName()).isEqualTo("Seller B Mechanical Keyboard");
        assertThat(sellerBOrderView.totalItems()).isEqualTo(1);
        assertThat(sellerBOrderView.subtotalAmount()).isEqualByComparingTo("4000.00");
        assertThat(sellerBOrderView.totalAmount()).isEqualByComparingTo("4000.00");

        // 3. Detail view via getOrderById
        OrderResponse sellerADetail = orderService.getOrderById(placedOrder.id(), sellerA);
        assertThat(sellerADetail.items()).hasSize(2);
        assertThat(sellerADetail.items()).noneMatch(item -> item.sellerId().equals(sellerB.getId()));

        OrderResponse sellerBDetail = orderService.getOrderById(placedOrder.id(), sellerB);
        assertThat(sellerBDetail.items()).hasSize(1);
        assertThat(sellerBDetail.items()).noneMatch(item -> item.sellerId().equals(sellerA.getId()));
    }

    @Test
    @DisplayName("Ownership check: Seller C cannot view order with 0 products belonging to Seller C")
    void sellerWithoutProducts_accessDeniedWith403() {
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 1));
        OrderResponse placedOrder = orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));

        // Seller C has no items in this order
        assertThatThrownBy(() -> orderService.getOrderById(placedOrder.id(), sellerC))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("You do not have items in this order");
    }

    @Test
    @DisplayName("Status lifecycle: Seller can advance forward (CONFIRMED -> PROCESSING), but cannot cancel")
    void sellerStatusTransitions_enforceLifecycleRules() {
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 1));
        OrderResponse placedOrder = orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));

        // Seller cannot cancel order
        assertThatThrownBy(() -> orderService.updateStatus(placedOrder.id(), OrderStatus.CANCELLED, sellerA))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Cannot transition order from PENDING to CANCELLED");

        // Seller advances PENDING -> CONFIRMED
        OrderResponse confirmed = orderService.updateStatus(placedOrder.id(), OrderStatus.CONFIRMED, sellerA);
        assertThat(confirmed.status()).isEqualTo(OrderStatus.CONFIRMED);

        // Seller advances CONFIRMED -> PROCESSING
        OrderResponse processing = orderService.updateStatus(placedOrder.id(), OrderStatus.PROCESSING, sellerA);
        assertThat(processing.status()).isEqualTo(OrderStatus.PROCESSING);

        // Seller advances PROCESSING -> SHIPPED
        OrderResponse shipped = orderService.updateStatus(placedOrder.id(), OrderStatus.SHIPPED, sellerA);
        assertThat(shipped.status()).isEqualTo(OrderStatus.SHIPPED);

        // Seller advances SHIPPED -> DELIVERED
        OrderResponse delivered = orderService.updateStatus(placedOrder.id(), OrderStatus.DELIVERED, sellerA);
        assertThat(delivered.status()).isEqualTo(OrderStatus.DELIVERED);
    }

    @Test
    @DisplayName("Real notifications: Sellers receive ORDER_PLACED on new order and ORDER_CANCELLED on customer cancellation")
    void sellerNotifications_emittedForPlacedAndCancelledOrders() {
        // Customer orders from Seller A and Seller B
        cartService.addItem(customer.getId(), new CartItemRequest(productA1.getId(), 1));
        cartService.addItem(customer.getId(), new CartItemRequest(productB.getId(), 1));

        OrderResponse placedOrder = orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));

        // Check Seller A notifications
        List<NotificationResponse> sellerANotifs = notificationService.getMyNotifications(sellerA);
        assertThat(sellerANotifs)
                .anyMatch(n -> n.type() == NotificationType.ORDER_PLACED && n.referenceId().equals(placedOrder.id()));

        // Check Seller B notifications
        List<NotificationResponse> sellerBNotifs = notificationService.getMyNotifications(sellerB);
        assertThat(sellerBNotifs)
                .anyMatch(n -> n.type() == NotificationType.ORDER_PLACED && n.referenceId().equals(placedOrder.id()));

        // Customer cancels order
        orderService.cancelOrder(placedOrder.id(), "Found better price", customer);

        // Check Seller A received cancellation notification
        List<NotificationResponse> sellerANotifsAfterCancel = notificationService.getMyNotifications(sellerA);
        assertThat(sellerANotifsAfterCancel)
                .anyMatch(n -> n.type() == NotificationType.ORDER_CANCELLED && n.referenceId().equals(placedOrder.id()));

        // Check Seller B received cancellation notification
        List<NotificationResponse> sellerBNotifsAfterCancel = notificationService.getMyNotifications(sellerB);
        assertThat(sellerBNotifsAfterCancel)
                .anyMatch(n -> n.type() == NotificationType.ORDER_CANCELLED && n.referenceId().equals(placedOrder.id()));
    }
}
