package com.securecommerce.platform;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.payment.controller.AdminPaymentController;
import com.securecommerce.platform.payment.dto.PaymentResponse;
import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentMethod;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.payment.service.PaymentService;
import com.securecommerce.platform.security.util.JwtUtil;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AdminPaymentManagementIntegrationTest — Integration test suite for AdminPaymentController.
 *
 * Validates:
 * 1. Admin successfully retrieves payment audit records.
 * 2. Customer receives HTTP 403 when accessing Admin payment endpoint.
 * 3. Seller receives HTTP 403 when accessing Admin payment endpoint.
 * 4. Unauthenticated requests receive HTTP 401.
 * 5. Pagination works correctly (multi-page distribution, bounds clamping, descending sort).
 * 6. Empty payment results are handled safely and return an empty page.
 * 7. Payment records remain completely unchanged after read operations (read-only immutability).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AdminPaymentManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminPaymentController adminPaymentController;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private User admin;
    private User customer;
    private User seller;

    private String adminToken;
    private String customerToken;
    private String sellerToken;

    @BeforeEach
    void setUp() {
        String token = UUID.randomUUID().toString().replaceAll("[^a-zA-Z]", "").toLowerCase();

        admin = userRepository.save(User.builder()
                .firstName("Arthur")
                .lastName("Admin")
                .email("admin_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .role(User.Role.ADMIN)
                .enabled(true)
                .build());
        adminToken = jwtUtil.generateToken(admin.getId(), admin.getRole().name());

        customer = userRepository.save(User.builder()
                .firstName("Charles")
                .lastName("Customer")
                .email("cust_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("CustomerPass123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());
        customerToken = jwtUtil.generateToken(customer.getId(), customer.getRole().name());

        seller = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Seller")
                .email("seller_" + token + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("SellerPass123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());
        sellerToken = jwtUtil.generateToken(seller.getId(), seller.getRole().name());
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

    private void authenticateAsCustomer() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(customer, null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")))
        );
    }

    private void authenticateAsSeller() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(seller, null, List.of(new SimpleGrantedAuthority("ROLE_SELLER")))
        );
    }

    private Order createOrder(User user, BigDecimal totalAmount) {
        return orderRepository.save(Order.builder()
                .customer(user)
                .shippingFullName(user.getFirstName() + " " + user.getLastName())
                .shippingPhone("9876543210")
                .shippingLine1("123 Commerce Avenue")
                .shippingCity("Bangalore")
                .shippingState("Karnataka")
                .shippingPostalCode("560001")
                .shippingCountry("India")
                .subtotalAmount(totalAmount)
                .totalAmount(totalAmount)
                .status(OrderStatus.CONFIRMED)
                .build());
    }

    private Payment createPayment(Order order, User user, BigDecimal amount, PaymentMethod method,
                                  PaymentStatus status, String txnId) {
        return paymentRepository.save(Payment.builder()
                .order(order)
                .customer(user)
                .paymentMethod(method)
                .gatewayMethod(method == PaymentMethod.UPI ? "upi" : (method == PaymentMethod.CARD ? "card" : "offline"))
                .paymentStatus(status)
                .amount(amount)
                .transactionId(txnId)
                .provider(method == PaymentMethod.COD ? "OFFLINE" : "RAZORPAY")
                .paymentGateway(method == PaymentMethod.COD ? "COD" : "RAZORPAY")
                .providerOrderId("order_rzp_" + System.nanoTime())
                .providerPaymentId("pay_rzp_" + System.nanoTime())
                .providerSignatureVerified(status == PaymentStatus.SUCCESS)
                .cardLast4(method == PaymentMethod.CARD ? "4242" : null)
                .upiIdSnapshot(method == PaymentMethod.UPI ? "customer@okaxis" : null)
                .build());
    }

    // =========================================================================
    // 1. Admin successfully retrieves payment records
    // =========================================================================
    @Test
    @DisplayName("Scenario 1: Admin successfully retrieves paginated payment records via HTTP and direct controller")
    void testAdminSuccessfullyRetrievesPaymentRecords() throws Exception {
        Order order1 = createOrder(customer, new BigDecimal("1499.00"));
        Order order2 = createOrder(customer, new BigDecimal("2999.00"));

        Payment payment1 = createPayment(order1, customer, new BigDecimal("1499.00"),
                PaymentMethod.CARD, PaymentStatus.SUCCESS, "TXN-CARD-" + System.nanoTime());
        Payment payment2 = createPayment(order2, customer, new BigDecimal("2999.00"),
                PaymentMethod.UPI, PaymentStatus.SUCCESS, "TXN-UPI-" + System.nanoTime());

        // 1. MockMvc HTTP layer verification
        mockMvc.perform(get("/admin/payments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Payments retrieved"))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.page.totalElements").value(2))
                .andExpect(jsonPath("$.data.content[*].transactionId",
                        hasItems(payment1.getTransactionId(), payment2.getTransactionId())))
                .andExpect(jsonPath("$.data.content[0].orderId").exists())
                .andExpect(jsonPath("$.data.content[0].customerId").value(customer.getId()))
                .andExpect(jsonPath("$.data.content[0].paymentStatus").exists());

        // 2. Direct controller invocation verification
        authenticateAsAdmin();
        ResponseEntity<ApiResponse<Page<PaymentResponse>>> response =
                adminPaymentController.getAllPayments(0, 15);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().getTotalElements()).isEqualTo(2);
        assertThat(response.getBody().getData().getContent())
                .extracting("transactionId")
                .contains(payment1.getTransactionId(), payment2.getTransactionId());
    }

    // =========================================================================
    // 2. Customer receives HTTP 403 when accessing Admin payment endpoint
    // =========================================================================
    @Test
    @DisplayName("Scenario 2: Customer receives HTTP 403 Forbidden when accessing Admin payment endpoint")
    void testCustomerReceivesForbiddenHttp403() throws Exception {
        Order order = createOrder(customer, new BigDecimal("999.00"));
        createPayment(order, customer, new BigDecimal("999.00"),
                PaymentMethod.CARD, PaymentStatus.SUCCESS, "TXN-" + System.nanoTime());

        // MockMvc HTTP layer verification
        mockMvc.perform(get("/admin/payments")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Direct controller method invocation verification
        authenticateAsCustomer();
        assertThatThrownBy(() -> adminPaymentController.getAllPayments(0, 15))
                .isInstanceOf(AccessDeniedException.class);
    }

    // =========================================================================
    // 3. Seller receives HTTP 403 when accessing Admin payment endpoint
    // =========================================================================
    @Test
    @DisplayName("Scenario 3: Seller receives HTTP 403 Forbidden when accessing Admin payment endpoint")
    void testSellerReceivesForbiddenHttp403() throws Exception {
        Order order = createOrder(customer, new BigDecimal("899.00"));
        createPayment(order, customer, new BigDecimal("899.00"),
                PaymentMethod.UPI, PaymentStatus.SUCCESS, "TXN-" + System.nanoTime());

        // MockMvc HTTP layer verification
        mockMvc.perform(get("/admin/payments")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isForbidden());

        // Direct controller method invocation verification
        authenticateAsSeller();
        assertThatThrownBy(() -> adminPaymentController.getAllPayments(0, 15))
                .isInstanceOf(AccessDeniedException.class);
    }

    // =========================================================================
    // 4. Unauthenticated requests receive HTTP 401
    // =========================================================================
    @Test
    @DisplayName("Scenario 4: Unauthenticated request receives HTTP 401 Unauthorized")
    void testUnauthenticatedReceivesUnauthorizedHttp401() throws Exception {
        Order order = createOrder(customer, new BigDecimal("599.00"));
        createPayment(order, customer, new BigDecimal("599.00"),
                PaymentMethod.COD, PaymentStatus.INITIATED, "TXN-" + System.nanoTime());

        // MockMvc HTTP layer verification
        mockMvc.perform(get("/admin/payments"))
                .andExpect(status().isUnauthorized());

        // Direct controller without SecurityContext verification
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> adminPaymentController.getAllPayments(0, 15))
                .satisfies(e -> assertThat(e).isInstanceOfAny(AuthenticationException.class, AccessDeniedException.class));
    }

    // =========================================================================
    // 5. Pagination works correctly
    // =========================================================================
    @Test
    @DisplayName("Scenario 5: Pagination distributes records correctly across pages and clamps bounds")
    void testPaginationWorksCorrectly() throws Exception {
        // Create 5 payment records across 5 orders
        for (int i = 1; i <= 5; i++) {
            Order order = createOrder(customer, new BigDecimal(100 * i));
            createPayment(order, customer, new BigDecimal(100 * i),
                    PaymentMethod.CARD, PaymentStatus.SUCCESS, "TXN-PAGINATION-" + i + "-" + System.nanoTime());
        }

        // Page 0, Size 2 -> expect 2 items, 3 total pages, 5 total elements
        mockMvc.perform(get("/admin/payments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.page.totalElements").value(5))
                .andExpect(jsonPath("$.data.page.totalPages").value(3))
                .andExpect(jsonPath("$.data.page.number").value(0))
                .andExpect(jsonPath("$.data.page.size").value(2));

        // Page 1, Size 2 -> expect 2 items, page number 1
        mockMvc.perform(get("/admin/payments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "1")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.page.number").value(1));

        // Page 2, Size 2 -> expect 1 item, last = true
        mockMvc.perform(get("/admin/payments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "2")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.page.number").value(2));

        // Page bounds clamping: size=0 clamps to minimum 1
        authenticateAsAdmin();
        ResponseEntity<ApiResponse<Page<PaymentResponse>>> responseClampedMin =
                adminPaymentController.getAllPayments(0, 0);
        assertThat(responseClampedMin.getBody().getData().getSize()).isEqualTo(1);

        // Page bounds clamping: size=500 clamps to maximum 100
        ResponseEntity<ApiResponse<Page<PaymentResponse>>> responseClampedMax =
                adminPaymentController.getAllPayments(0, 500);
        assertThat(responseClampedMax.getBody().getData().getSize()).isEqualTo(100);

        // Default pagination: calling without page/size params uses defaults (page=0, size=15)
        mockMvc.perform(get("/admin/payments")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.page.size").value(15))
                .andExpect(jsonPath("$.data.page.number").value(0))
                .andExpect(jsonPath("$.data.content.length()").value(5));
    }

    // =========================================================================
    // 6. Empty payment results are handled correctly
    // =========================================================================
    @Test
    @DisplayName("Scenario 6: Empty payment repository returns empty page without error (200 OK)")
    void testEmptyPaymentResultsHandledCorrectly() throws Exception {
        // HTTP layer verification with 0 payments
        mockMvc.perform(get("/admin/payments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Payments retrieved"))
                .andExpect(jsonPath("$.data.content").isEmpty())
                .andExpect(jsonPath("$.data.page.totalElements").value(0))
                .andExpect(jsonPath("$.data.page.totalPages").value(0));

        // Direct controller verification
        authenticateAsAdmin();
        ResponseEntity<ApiResponse<Page<PaymentResponse>>> response =
                adminPaymentController.getAllPayments(0, 15);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getContent()).isEmpty();
        assertThat(response.getBody().getData().getTotalElements()).isZero();
        assertThat(response.getBody().getData().getTotalPages()).isZero();
    }

    // =========================================================================
    // 7. Payment records remain unchanged after read operations
    // =========================================================================
    @Test
    @DisplayName("Scenario 7: Read operations are strictly idempotent and do not modify payment records")
    void testPaymentRecordsRemainUnchangedAfterReadOperations() throws Exception {
        Order order1 = createOrder(customer, new BigDecimal("1250.00"));
        Order order2 = createOrder(customer, new BigDecimal("3400.00"));

        Payment payment1 = createPayment(order1, customer, new BigDecimal("1250.00"),
                PaymentMethod.CARD, PaymentStatus.SUCCESS, "TXN-IMMUTABLE-1-" + System.nanoTime());
        Payment payment2 = createPayment(order2, customer, new BigDecimal("3400.00"),
                PaymentMethod.COD, PaymentStatus.INITIATED, "TXN-IMMUTABLE-2-" + System.nanoTime());

        // Snapshot initial state
        Payment beforeP1 = paymentRepository.findById(payment1.getId()).orElseThrow();
        Payment beforeP2 = paymentRepository.findById(payment2.getId()).orElseThrow();

        Long p1Id = beforeP1.getId();
        BigDecimal p1Amount = beforeP1.getAmount();
        PaymentStatus p1Status = beforeP1.getPaymentStatus();
        String p1Txn = beforeP1.getTransactionId();
        Instant p1CreatedAt = beforeP1.getCreatedAt();
        Instant p1UpdatedAt = beforeP1.getUpdatedAt();

        Long p2Id = beforeP2.getId();
        BigDecimal p2Amount = beforeP2.getAmount();
        PaymentStatus p2Status = beforeP2.getPaymentStatus();
        String p2Txn = beforeP2.getTransactionId();
        Instant p2CreatedAt = beforeP2.getCreatedAt();
        Instant p2UpdatedAt = beforeP2.getUpdatedAt();

        // Perform multiple read operations via MockMvc and Controller
        mockMvc.perform(get("/admin/payments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());

        authenticateAsAdmin();
        adminPaymentController.getAllPayments(0, 10);
        paymentService.getAllPaymentsForAdmin(PageRequest.of(0, 10));

        // Re-read from database and assert complete immutability
        Payment afterP1 = paymentRepository.findById(p1Id).orElseThrow();
        Payment afterP2 = paymentRepository.findById(p2Id).orElseThrow();

        assertThat(paymentRepository.count()).isEqualTo(2);

        // Assert payment 1 unchanged
        assertThat(afterP1.getAmount()).isEqualByComparingTo(p1Amount);
        assertThat(afterP1.getPaymentStatus()).isEqualTo(p1Status);
        assertThat(afterP1.getTransactionId()).isEqualTo(p1Txn);
        assertThat(afterP1.getCreatedAt()).isEqualTo(p1CreatedAt);
        assertThat(afterP1.getUpdatedAt()).isEqualTo(p1UpdatedAt);
        assertThat(afterP1.getProviderSignatureVerified()).isEqualTo(beforeP1.getProviderSignatureVerified());

        // Assert payment 2 unchanged
        assertThat(afterP2.getAmount()).isEqualByComparingTo(p2Amount);
        assertThat(afterP2.getPaymentStatus()).isEqualTo(p2Status);
        assertThat(afterP2.getTransactionId()).isEqualTo(p2Txn);
        assertThat(afterP2.getCreatedAt()).isEqualTo(p2CreatedAt);
        assertThat(afterP2.getUpdatedAt()).isEqualTo(p2UpdatedAt);
        assertThat(afterP2.getProviderSignatureVerified()).isEqualTo(beforeP2.getProviderSignatureVerified());
    }
}

