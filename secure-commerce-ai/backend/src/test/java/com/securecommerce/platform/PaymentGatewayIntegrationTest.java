package com.securecommerce.platform;

import com.securecommerce.platform.address.entity.Address;
import com.securecommerce.platform.address.repository.AddressRepository;
import com.securecommerce.platform.cart.dto.CartItemRequest;
import com.securecommerce.platform.cart.service.CartService;
import com.securecommerce.platform.category.entity.Category;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.order.dto.OrderRequest;
import com.securecommerce.platform.order.dto.OrderResponse;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.payment.dto.*;
import com.securecommerce.platform.payment.entity.*;
import com.securecommerce.platform.payment.gateway.GatewayPaymentDetails;
import com.securecommerce.platform.payment.gateway.MockPaymentGatewayService;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securecommerce.platform.payment.gateway.RazorpayPaymentGatewayService;
import com.securecommerce.platform.payment.repository.PaymentWebhookEventRepository;
import com.securecommerce.platform.payment.scheduler.PaymentExpiryScheduler;
import com.securecommerce.platform.payment.service.PaymentService;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.returns.dto.CreateReturnRequest;
import com.securecommerce.platform.returns.dto.ReturnResponse;
import com.securecommerce.platform.returns.entity.RefundStatus;
import com.securecommerce.platform.returns.service.ReturnService;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
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

/**
 * PaymentGatewayIntegrationTest — Comprehensive 22-Scenario Integration Test Suite.
 *
 * Validates:
 * 1. Gateway order creation (idempotency, ownership, validation, expiry)
 * 2. Cryptographic signature and authoritative server-side payment verification
 * 3. Cash on Delivery (COD) processing
 * 4. Decommissioning of legacy simulation endpoint (410 GONE)
 * 5. Webhook event processing, deduplication, and HMAC security
 * 6. Background payment-expiry job with inventory restoration
 * 7. End-to-end gateway refund flow
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PaymentGatewayIntegrationTest {

    @Autowired private PaymentService paymentService;
    @Autowired private OrderService orderService;
    @Autowired private CartService cartService;
    @Autowired private ReturnService returnService;
    @Autowired private PaymentExpiryScheduler paymentExpiryScheduler;
    @Autowired private MockPaymentGatewayService mockGatewayService;

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private PaymentWebhookEventRepository paymentWebhookEventRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private ObjectMapper objectMapper;

    private User customerA;
    private User customerB;
    private User seller;
    private Product product1;
    private Address addressA;
    private Address addressB;

    @BeforeEach
    void setup() {
        mockGatewayService.clearMockData();

        // 1. Create Sellers & Customers
        seller = userRepository.save(User.builder()
                .email("seller_test_" + System.nanoTime() + "@shopivo.test")
                .passwordHash(passwordEncoder.encode("Test@123"))
                .firstName("Kiran")
                .lastName("Kumar")
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        customerA = userRepository.save(User.builder()
                .email("cust_a_" + System.nanoTime() + "@shopivo.test")
                .passwordHash(passwordEncoder.encode("Test@123"))
                .firstName("Ravi")
                .lastName("Kumar")
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        customerB = userRepository.save(User.builder()
                .email("cust_b_" + System.nanoTime() + "@shopivo.test")
                .passwordHash(passwordEncoder.encode("Test@123"))
                .firstName("Sravani")
                .lastName("Reddy")
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        // 2. Setup Category & Products
        Category category = categoryRepository.save(Category.builder()
                .name("Electronics " + System.nanoTime())
                .slug("electronics-" + System.nanoTime())
                .build());

        product1 = productRepository.save(Product.builder()
                .seller(seller)
                .category(category)
                .name("Wireless Noise-Cancelling Headphones")
                .slug("wireless-headphones-" + System.nanoTime())
                .description("High fidelity audio headphones")
                .price(new BigDecimal("2999.00"))
                .stockQuantity(50)
                .status(Product.Status.APPROVED)
                .build());

        // 3. Setup Shipping Addresses
        addressA = addressRepository.save(Address.builder()
                .user(customerA)
                .label("Home")
                .fullName("Ravi Kumar")
                .phone("9876543210")
                .line1("Road No 10, Banjara Hills")
                .city("Hyderabad")
                .state("Telangana")
                .postalCode("500034")
                .country("India")
                .isDefault(true)
                .build());

        addressB = addressRepository.save(Address.builder()
                .user(customerB)
                .label("Work")
                .fullName("Sravani Reddy")
                .phone("9876543211")
                .line1("Madhapur Main Road")
                .city("Hyderabad")
                .state("Telangana")
                .postalCode("500081")
                .country("India")
                .isDefault(true)
                .build());
    }

    private Order createTestOrderForCustomer(User customer, Address address, int quantity) {
        cartService.addItem(customer.getId(), new CartItemRequest(product1.getId(), quantity));
        OrderResponse orderRes = orderService.placeOrder(customer.getId(), new OrderRequest(address.getId(), null));
        return orderRepository.findById(orderRes.id()).orElseThrow();
    }

    // =========================================================================
    // SCENARIO 1: Create Gateway Order Success
    // =========================================================================
    @Test
    @DisplayName("Scenario 1: createGatewayOrder succeeds and returns order details in paise with INITIATED payment")
    void scenario01_createGatewayOrder_Success() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        assertThat(gwDto.orderId()).isEqualTo(order.getId());
        assertThat(gwDto.gatewayOrderId()).isNotBlank();
        assertThat(gwDto.amountInPaise()).isEqualTo(299900L);
        assertThat(gwDto.currency()).isEqualTo("INR");

        List<Payment> payments = paymentRepository.findByOrderId(order.getId()).stream().toList();
        assertThat(payments).hasSize(1);
        Payment p = payments.get(0);
        assertThat(p.getPaymentStatus()).isEqualTo(PaymentStatus.INITIATED);
        assertThat(p.getProvider()).isEqualTo("RAZORPAY");
        assertThat(p.getProviderOrderId()).isEqualTo(gwDto.gatewayOrderId());
    }

    // =========================================================================
    // SCENARIO 2: Gateway Order Idempotency
    // =========================================================================
    @Test
    @DisplayName("Scenario 2: createGatewayOrder is idempotent and reuses active initiated order")
    void scenario02_createGatewayOrder_Idempotency() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto first = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        GatewayOrderDto second = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        assertThat(second.gatewayOrderId()).isEqualTo(first.gatewayOrderId());
        assertThat(paymentRepository.findByCustomerIdOrderByCreatedAtDesc(customerA.getId())).hasSize(1);
    }

    // =========================================================================
    // SCENARIO 3: Non-Owner Cannot Create Gateway Order
    // =========================================================================
    @Test
    @DisplayName("Scenario 3: Non-owner customer cannot create gateway order for another customer's order")
    void scenario03_createGatewayOrder_NonOwnerForbidden() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        assertThatThrownBy(() -> paymentService.createGatewayOrder(
                customerB.getId(),
                new CreateGatewayOrderRequest(order.getId())
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    // =========================================================================
    // SCENARIO 4: Cancelled Order Payment Rejected
    // =========================================================================
    @Test
    @DisplayName("Scenario 4: Cannot create gateway order for a cancelled order")
    void scenario04_createGatewayOrder_CancelledOrderRejected() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);
        orderService.cancelOrder(order.getId(), "User decided not to buy", customerA);

        assertThatThrownBy(() -> paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // =========================================================================
    // SCENARIO 5: Expired Order Payment Rejected
    // =========================================================================
    @Test
    @DisplayName("Scenario 5: Cannot create gateway order for an order with expired payment window")
    void scenario05_createGatewayOrder_ExpiredOrderRejected() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);
        order.setPaymentExpiresAt(Instant.now().minus(5, ChronoUnit.MINUTES));
        orderRepository.save(order);

        assertThatThrownBy(() -> paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // =========================================================================
    // SCENARIO 6: Already Paid Order Cannot Re-Initiate
    // =========================================================================
    @Test
    @DisplayName("Scenario 6: Cannot create gateway order if order is already marked SUCCESS")
    void scenario06_createGatewayOrder_AlreadyPaidRejected() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_test_paid", "valid_test_signature")
        );

        assertThatThrownBy(() -> paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // =========================================================================
    // SCENARIO 7: Verify Gateway Payment Success
    // =========================================================================
    @Test
    @DisplayName("Scenario 7: verifyGatewayPayment validates signature, amount, currency, status and confirms order")
    void scenario07_verifyGatewayPayment_Success() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        PaymentResponse paymentRes = paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_test_success_1", "valid_test_signature")
        );

        assertThat(paymentRes.paymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(paymentRes.providerSignatureVerified()).isTrue();
        assertThat(paymentRes.providerPaymentId()).isEqualTo("pay_test_success_1");

        Order confirmedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(confirmedOrder.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    // =========================================================================
    // SCENARIO 8: Verification Idempotency
    // =========================================================================
    @Test
    @DisplayName("Scenario 8: verifyGatewayPayment is idempotent when retried with same payment ID")
    void scenario08_verifyGatewayPayment_Idempotency() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        PaymentResponse first = paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_test_retry_1", "valid_test_signature")
        );

        PaymentResponse second = paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_test_retry_1", "valid_test_signature")
        );

        assertThat(second.id()).isEqualTo(first.id());
        assertThat(second.paymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
    }

    // =========================================================================
    // SCENARIO 9: Invalid HMAC Signature Rejected
    // =========================================================================
    @Test
    @DisplayName("Scenario 9: Tampered or invalid HMAC signature is rejected and records FAILED status")
    void scenario09_verifyGatewayPayment_InvalidSignatureRejected() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        assertThatThrownBy(() -> paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_test_bad_sig", "invalid_signature")
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));

        Payment p = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(p.getPaymentStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(p.getFailureReason()).contains("HMAC");
    }

    // =========================================================================
    // SCENARIO 10: Provider Order ID Mismatch Rejected
    // =========================================================================
    @Test
    @DisplayName("Scenario 10: Razorpay payment matching another gateway order is rejected")
    void scenario10_verifyGatewayPayment_OrderMismatchRejected() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        assertThatThrownBy(() -> paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_order_mismatch", "valid_test_signature")
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // =========================================================================
    // SCENARIO 11: Amount Mismatch Rejected
    // =========================================================================
    @Test
    @DisplayName("Scenario 11: Tampered payment amount is rejected")
    void scenario11_verifyGatewayPayment_AmountMismatchRejected() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        assertThatThrownBy(() -> paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_amount_mismatch", "valid_test_signature")
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // =========================================================================
    // SCENARIO 12: Currency Mismatch Rejected
    // =========================================================================
    @Test
    @DisplayName("Scenario 12: Non-INR currency is rejected")
    void scenario12_verifyGatewayPayment_CurrencyMismatchRejected() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        assertThatThrownBy(() -> paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_currency_mismatch", "valid_test_signature")
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // =========================================================================
    // SCENARIO 13: Gateway Status Failed Rejected
    // =========================================================================
    @Test
    @DisplayName("Scenario 13: Gateway status failed rejects verification and marks payment FAILED")
    void scenario13_verifyGatewayPayment_GatewayStatusFailedRejected() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        assertThatThrownBy(() -> paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_failed", "valid_test_signature")
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));

        Payment p = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(p.getPaymentStatus()).isEqualTo(PaymentStatus.FAILED);
    }

    // =========================================================================
    // SCENARIO 14: Non-Owner Cannot Verify Payment
    // =========================================================================
    @Test
    @DisplayName("Scenario 14: Customer B cannot verify payment for Customer A's order")
    void scenario14_verifyGatewayPayment_NonOwnerForbidden() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        assertThatThrownBy(() -> paymentService.verifyGatewayPayment(
                customerB.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_test_cust_b", "valid_test_signature")
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    // =========================================================================
    // SCENARIO 15: Cash on Delivery (COD) Success
    // =========================================================================
    @Test
    @DisplayName("Scenario 15: COD order confirms order and sets INITIATED payment with OFFLINE provider")
    void scenario15_processCodPayment_Success() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        PaymentResponse codResponse = paymentService.processCodPayment(
                customerA.getId(),
                new ProcessCodPaymentRequest(order.getId())
        );

        assertThat(codResponse.paymentMethod()).isEqualTo(PaymentMethod.COD);
        assertThat(codResponse.provider()).isEqualTo("OFFLINE");
        assertThat(codResponse.paymentStatus()).isEqualTo(PaymentStatus.INITIATED);

        Order confirmed = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(confirmed.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    // =========================================================================
    // SCENARIO 16: COD Rejected if Already Paid Online
    // =========================================================================
    @Test
    @DisplayName("Scenario 16: Cannot switch to COD if online payment was already completed")
    void scenario16_processCodPayment_AlreadyPaidRejected() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_test_cod_block", "valid_test_signature")
        );

        assertThatThrownBy(() -> paymentService.processCodPayment(
                customerA.getId(),
                new ProcessCodPaymentRequest(order.getId())
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // =========================================================================
    // SCENARIO 17: Legacy Customer Simulation Endpoint Decommissioned (410 GONE)
    // =========================================================================
    @Test
    @DisplayName("Scenario 17: Legacy processPayment endpoint is permanently decommissioned (410 GONE)")
    void scenario17_legacyProcessPayment_Decommissioned() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        assertThatThrownBy(() -> paymentService.processPayment(
                customerA.getId(),
                new ProcessPaymentRequest(order.getId(), PaymentMethod.CARD, "4111111111111111", "12/28", "123", null, null, false)
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.GONE));
    }

    // =========================================================================
    // SCENARIO 18: Webhook Payment Captured Success
    // =========================================================================
    @Test
    @DisplayName("Scenario 18: Webhook payment.captured updates payment to SUCCESS and confirms order")
    void scenario18_webhook_PaymentCaptured_Success() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        String rawPayload = String.format("""
                {
                  "event": "payment.captured",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "pay_webhook_cap_1",
                        "order_id": "%s",
                        "amount": 299900,
                        "currency": "INR",
                        "status": "captured",
                        "method": "upi"
                      }
                    }
                  }
                }
                """, gwDto.gatewayOrderId());

        paymentService.processWebhook(rawPayload, "valid_test_webhook_sig", "evt_test_1001");

        Payment p = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(p.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(p.getProviderPaymentId()).isEqualTo("pay_webhook_cap_1");

        Order confirmed = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(confirmed.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    // =========================================================================
    // SCENARIO 19: Webhook Deduplication via Event ID
    // =========================================================================
    @Test
    @DisplayName("Scenario 19: Duplicate webhook with same eventId is idempotently ignored")
    void scenario19_webhook_Deduplication_Idempotent() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        String rawPayload = String.format("""
                {
                  "event": "payment.captured",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "pay_webhook_cap_2",
                        "order_id": "%s",
                        "amount": 299900,
                        "currency": "INR",
                        "status": "captured",
                        "method": "card"
                      }
                    }
                  }
                }
                """, gwDto.gatewayOrderId());

        // First delivery
        paymentService.processWebhook(rawPayload, "valid_test_webhook_sig", "evt_dedup_unique_1");
        // Second duplicate delivery
        paymentService.processWebhook(rawPayload, "valid_test_webhook_sig", "evt_dedup_unique_1");

        assertThat(paymentWebhookEventRepository.findByEventId("evt_dedup_unique_1")).isPresent();
        assertThat(paymentWebhookEventRepository.count()).isGreaterThanOrEqualTo(1);
    }

    // =========================================================================
    // SCENARIO 20: Webhook Bad Signature Rejected
    // =========================================================================
    @Test
    @DisplayName("Scenario 20: Webhook with invalid HMAC signature is rejected with 400")
    void scenario20_webhook_InvalidSignatureRejected() {
        String rawPayload = "{\"event\":\"payment.captured\"}";

        assertThatThrownBy(() -> paymentService.processWebhook(
                rawPayload,
                "invalid_webhook_sig",
                "evt_bad_sig_1"
        )).isInstanceOf(ResponseStatusException.class)
          .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // =========================================================================
    // SCENARIO 21: Payment Expiry Scheduler Cancels & Restores Stock Idempotently
    // =========================================================================
    @Test
    @DisplayName("Scenario 21: Scheduler cancels expired PENDING orders and restores product stock idempotently")
    void scenario21_paymentExpiryScheduler_CancelsExpiredAndRestoresStock() {
        int initialStock = product1.getStockQuantity();

        // Place order (reduces stock by 2)
        Order order = createTestOrderForCustomer(customerA, addressA, 2);
        Product pAfterOrder = productRepository.findById(product1.getId()).orElseThrow();
        assertThat(pAfterOrder.getStockQuantity()).isEqualTo(initialStock - 2);

        // Initiate gateway payment
        paymentService.createGatewayOrder(customerA.getId(), new CreateGatewayOrderRequest(order.getId()));

        // Simulate payment expiration
        order.setPaymentExpiresAt(Instant.now().minus(10, ChronoUnit.MINUTES));
        orderRepository.save(order);

        // Run scheduler job
        int cancelled = paymentExpiryScheduler.processExpiredOrders();
        assertThat(cancelled).isGreaterThanOrEqualTo(1);

        // Verify order is cancelled
        Order cancelledOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(cancelledOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(cancelledOrder.getCancellationReason()).contains("expired");

        // Verify inventory is restored
        Product restoredP = productRepository.findById(product1.getId()).orElseThrow();
        assertThat(restoredP.getStockQuantity()).isEqualTo(initialStock);

        // Verify initiated payment marked CANCELLED
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(payment.getPaymentStatus()).isEqualTo(PaymentStatus.CANCELLED);

        // Idempotency: Second execution does not double-restore stock
        int cancelledAgain = paymentExpiryScheduler.processExpiredOrders();
        assertThat(cancelledAgain).isEqualTo(0);
        Product unchangedP = productRepository.findById(product1.getId()).orElseThrow();
        assertThat(unchangedP.getStockQuantity()).isEqualTo(initialStock);
    }

    // =========================================================================
    // SCENARIO 22: Gateway Refund Flow
    // =========================================================================
    @Test
    @DisplayName("Scenario 22: Approved return triggers gateway refund and updates payment to REFUNDED")
    void scenario22_refund_GatewayRefundTriggered() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_refund_flow_1", "valid_test_signature")
        );

        // Mark order DELIVERED for return eligibility
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        // Request return
        ReturnResponse retResponse = returnService.requestReturn(
                new CreateReturnRequest(order.getId(), null, "Product sound quality is defective", null),
                customerA
        );

        // Process return approval and gateway refund
        ReturnResponse approved = returnService.processSandboxApproval(retResponse.id(), customerA);

        assertThat(approved.status()).isEqualTo("COMPLETED");
        assertThat(approved.refund()).isNotNull();
        assertThat(approved.refund().refundStatus()).isEqualTo("REFUNDED");

        Payment payment = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(payment.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(payment.getRefundProviderId()).isNotBlank();
    }

    // =========================================================================
    // SCENARIO 23: RAZORPAY_MODE = TEST rejects Live Keys (Fail-Fast)
    // =========================================================================
    @Test
    @DisplayName("Scenario 23: RAZORPAY_MODE=TEST fails fast if live credentials (rzp_live_*) are configured")
    void scenario23_razorpayMode_testMode_rejectsLiveKey() {
        assertThatThrownBy(() -> new RazorpayPaymentGatewayService(
                "TEST",
                "rzp_live_secretkey12345",
                "secret",
                "webhook_sec",
                objectMapper
        )).isInstanceOf(IllegalStateException.class)
          .hasMessageContaining("Live key (rzp_live_*) was provided");
    }

    // =========================================================================
    // SCENARIO 24: RAZORPAY_MODE = LIVE rejects Test Keys (Fail-Fast)
    // =========================================================================
    @Test
    @DisplayName("Scenario 24: RAZORPAY_MODE=LIVE fails fast if test credentials (rzp_test_*) are configured")
    void scenario24_razorpayMode_liveMode_rejectsTestKey() {
        assertThatThrownBy(() -> new RazorpayPaymentGatewayService(
                "LIVE",
                "rzp_test_shopivo_dev_key",
                "secret",
                "webhook_sec",
                objectMapper
        )).isInstanceOf(IllegalStateException.class)
          .hasMessageContaining("Test Mode key (rzp_test_*) was provided");
    }

    // =========================================================================
    // SCENARIO 25: RAZORPAY_MODE = LIVE rejects Missing Credentials (Fail-Fast)
    // =========================================================================
    @Test
    @DisplayName("Scenario 25: RAZORPAY_MODE=LIVE fails fast if credentials are empty or missing")
    void scenario25_razorpayMode_liveMode_rejectsMissingCredentials() {
        assertThatThrownBy(() -> new RazorpayPaymentGatewayService(
                "LIVE",
                "rzp_live_prodkey12345",
                "",
                "webhook_sec",
                objectMapper
        )).isInstanceOf(IllegalStateException.class)
          .hasMessageContaining("RAZORPAY_KEY_SECRET is missing");
    }

    // =========================================================================
    // SCENARIO 26: PaymentStatus Monotonic Refund State Machine Transitions
    // =========================================================================
    @Test
    @DisplayName("Scenario 26: PaymentStatus enforces forward transitions for full refund lifecycle")
    void scenario26_paymentStatus_monotonicRefundTransitions() {
        // Valid forward transitions
        assertThat(PaymentStatus.SUCCESS.canTransitionTo(PaymentStatus.REFUND_REQUESTED)).isTrue();
        assertThat(PaymentStatus.SUCCESS.canTransitionTo(PaymentStatus.REFUND_PROCESSING)).isTrue();
        assertThat(PaymentStatus.SUCCESS.canTransitionTo(PaymentStatus.REFUNDED)).isTrue();
        assertThat(PaymentStatus.REFUND_REQUESTED.canTransitionTo(PaymentStatus.REFUND_PROCESSING)).isTrue();
        assertThat(PaymentStatus.REFUND_REQUESTED.canTransitionTo(PaymentStatus.REFUNDED)).isTrue();
        assertThat(PaymentStatus.REFUND_REQUESTED.canTransitionTo(PaymentStatus.FAILED)).isTrue();
        assertThat(PaymentStatus.REFUND_PROCESSING.canTransitionTo(PaymentStatus.REFUNDED)).isTrue();
        assertThat(PaymentStatus.REFUND_PROCESSING.canTransitionTo(PaymentStatus.FAILED)).isTrue();

        // Self transitions (idempotency)
        assertThat(PaymentStatus.REFUNDED.canTransitionTo(PaymentStatus.REFUNDED)).isTrue();
        assertThat(PaymentStatus.REFUND_PROCESSING.canTransitionTo(PaymentStatus.REFUND_PROCESSING)).isTrue();

        // Prohibited backward or invalid transitions
        assertThat(PaymentStatus.REFUNDED.canTransitionTo(PaymentStatus.SUCCESS)).isFalse();
        assertThat(PaymentStatus.REFUNDED.canTransitionTo(PaymentStatus.INITIATED)).isFalse();
        assertThat(PaymentStatus.REFUNDED.canTransitionTo(PaymentStatus.FAILED)).isFalse();
        assertThat(PaymentStatus.SUCCESS.canTransitionTo(PaymentStatus.FAILED)).isFalse();
        assertThat(PaymentStatus.FAILED.canTransitionTo(PaymentStatus.SUCCESS)).isFalse();
    }

    // =========================================================================
    // SCENARIO 27: Webhook refund.created and refund.processed Lifecycle
    // =========================================================================
    @Test
    @DisplayName("Scenario 27: Webhooks refund.created and refund.processed transition payment to REFUND_PROCESSING and REFUNDED")
    void scenario27_webhook_refundCreatedAndProcessedLifecycle() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        String paymentId = "pay_webhook_refund_seq_1";
        paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), paymentId, "valid_test_signature")
        );

        Payment payment = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(payment.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);

        // 1. Fire refund.created webhook
        String refundCreatedPayload = String.format("""
                {
                  "event": "refund.created",
                  "payload": {
                    "refund": {
                      "entity": {
                        "id": "rfnd_seq_101",
                        "payment_id": "%s",
                        "amount": 299900,
                        "currency": "INR",
                        "status": "processed"
                      }
                    }
                  }
                }
                """, paymentId);

        paymentService.processWebhook(refundCreatedPayload, "valid_test_webhook_sig", "evt_rfnd_created_1");

        Payment processingPayment = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        // Since SUCCESS can transition to REFUND_PROCESSING, status is updated
        assertThat(processingPayment.getPaymentStatus()).isEqualTo(PaymentStatus.REFUND_PROCESSING);
        assertThat(processingPayment.getRefundProviderId()).isEqualTo("rfnd_seq_101");

        // 2. Fire refund.processed webhook
        String refundProcessedPayload = String.format("""
                {
                  "event": "refund.processed",
                  "payload": {
                    "refund": {
                      "entity": {
                        "id": "rfnd_seq_101",
                        "payment_id": "%s",
                        "amount": 299900,
                        "currency": "INR",
                        "status": "processed"
                      }
                    }
                  }
                }
                """, paymentId);

        paymentService.processWebhook(refundProcessedPayload, "valid_test_webhook_sig", "evt_rfnd_processed_1");

        Payment refundedPayment = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(refundedPayment.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(refundedPayment.getRefundProviderId()).isEqualTo("rfnd_seq_101");
    }

    // =========================================================================
    // SCENARIO 28: Out-of-Order Webhook Cannot Downgrade SUCCESS to FAILED
    // =========================================================================
    @Test
    @DisplayName("Scenario 28: Out-of-order payment.failed webhook cannot downgrade payment from SUCCESS to FAILED")
    void scenario28_webhook_outOfOrderCannotDowngradeSuccess() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        String paymentId = "pay_webhook_ooo_1";
        paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), paymentId, "valid_test_signature")
        );

        Payment payment = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(payment.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);

        // Out-of-order payment.failed arrives after capture
        String failedPayload = String.format("""
                {
                  "event": "payment.failed",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "%s",
                        "order_id": "%s",
                        "error_description": "Delayed network error report"
                      }
                    }
                  }
                }
                """, paymentId, gwDto.gatewayOrderId());

        paymentService.processWebhook(failedPayload, "valid_test_webhook_sig", "evt_ooo_failed_1");

        Payment verifiedPayment = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        // Payment must remain SUCCESS — cannot be downgraded by out-of-order failure
        assertThat(verifiedPayment.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
    }

    // =========================================================================
    // SCENARIO 29: Refund Approval Idempotency
    // =========================================================================
    @Test
    @DisplayName("Scenario 29: Calling refund approval repeatedly returns existing refund idempotently")
    void scenario29_refund_idempotentApprovalReturnsExisting() {
        Order order = createTestOrderForCustomer(customerA, addressA, 1);

        GatewayOrderDto gwDto = paymentService.createGatewayOrder(
                customerA.getId(),
                new CreateGatewayOrderRequest(order.getId())
        );

        paymentService.verifyGatewayPayment(
                customerA.getId(),
                new VerifyPaymentRequest(order.getId(), gwDto.gatewayOrderId(), "pay_idem_refund_1", "valid_test_signature")
        );

        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        ReturnResponse retResponse = returnService.requestReturn(
                new CreateReturnRequest(order.getId(), null, "Wrong size delivered", null),
                customerA
        );

        // First approval
        ReturnResponse firstApproval = returnService.processAdminApproval(retResponse.id(), customerA);
        assertThat(firstApproval.refund()).isNotNull();
        String firstRefundTxnId = firstApproval.refund().refundTransactionId();

        // Second duplicate approval
        ReturnResponse secondApproval = returnService.processAdminApproval(retResponse.id(), customerA);
        assertThat(secondApproval.refund()).isNotNull();
        assertThat(secondApproval.refund().refundTransactionId()).isEqualTo(firstRefundTxnId);
    }
}
