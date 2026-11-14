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
import com.securecommerce.platform.order.entity.OrderItem;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.order.service.OrderService;
import com.securecommerce.platform.payment.dto.CreateGatewayOrderRequest;
import com.securecommerce.platform.payment.dto.GatewayOrderDto;
import com.securecommerce.platform.payment.dto.VerifyPaymentRequest;
import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import com.securecommerce.platform.payment.gateway.MockPaymentGatewayService;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.payment.service.PaymentService;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.returns.dto.CreateReturnRequest;
import com.securecommerce.platform.returns.dto.RejectReturnRequest;
import com.securecommerce.platform.returns.dto.ReturnResponse;
import com.securecommerce.platform.returns.entity.Refund;
import com.securecommerce.platform.returns.entity.ReturnRequest;
import com.securecommerce.platform.returns.entity.ReturnStatus;
import com.securecommerce.platform.returns.repository.RefundRepository;
import com.securecommerce.platform.returns.repository.ReturnRequestRepository;
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
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * SellerRefundWorkflowIntegrationTest — Production-grade Verification of Seller-Approved Razorpay Refund Workflow.
 *
 * Verifies:
 * 1. Repeated approval after REFUNDED (idempotent, zero duplicate gateway calls)
 * 2. Repeated approval after REFUND_PROCESSING (in-flight guard, no duplicate gateway calls)
 * 3. Two simultaneous approval requests (concurrency serialization via row lock, processed at most once)
 * 4. Gateway timeout handling (safe REFUND_PROCESSING record, blocks blind duplicate resubmissions)
 * 5. Duplicate refund webhook (idempotent reconciliation)
 * 6. Seller rejection (enforced rejection, subsequent approval blocked)
 * 7. Unauthorized seller approval (403 Forbidden cross-seller isolation)
 * 8. Inventory restored exactly once across all retry and webhook paths
 */
@SpringBootTest
@ActiveProfiles("test")
public class SellerRefundWorkflowIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private CartService cartService;
    @Autowired private OrderService orderService;
    @Autowired private PaymentService paymentService;
    @Autowired private ReturnService returnService;
    @Autowired private ReturnRequestRepository returnRequestRepository;
    @Autowired private RefundRepository refundRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private MockPaymentGatewayService mockPaymentGatewayService;

    private User sellerA;
    private User sellerB;
    private User customer;
    private Category category;
    private Address customerAddress;

    @BeforeEach
    void setUp() {
        mockPaymentGatewayService.clearMockData();

        long nano = System.nanoTime();

        sellerA = userRepository.save(User.builder()
                .email("seller_a_" + nano + "@shopivo.test")
                .passwordHash(passwordEncoder.encode("Test@123"))
                .firstName("Alpha")
                .lastName("Seller")
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        sellerB = userRepository.save(User.builder()
                .email("seller_b_" + nano + "@shopivo.test")
                .passwordHash(passwordEncoder.encode("Test@123"))
                .firstName("Beta")
                .lastName("Seller")
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        customer = userRepository.save(User.builder()
                .email("cust_" + nano + "@shopivo.test")
                .passwordHash(passwordEncoder.encode("Test@123"))
                .firstName("Valued")
                .lastName("Customer")
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Electronics " + nano)
                .slug("electronics-" + nano)
                .build());

        customerAddress = addressRepository.save(Address.builder()
                .user(customer)
                .label("Home")
                .fullName("Valued Customer")
                .phone("9876543210")
                .line1("123 Tech Park")
                .city("Bengaluru")
                .state("Karnataka")
                .postalCode("560001")
                .country("India")
                .isDefault(true)
                .build());
    }

    private record TestSetup(Order order, OrderItem item, Product product, ReturnResponse returnResponse) {}

    private TestSetup createPurchasedAndReturnedTestOrder(User seller, String paymentId, int initialStock, int orderQuantity) {
        long nano = System.nanoTime();
        Product product = productRepository.save(Product.builder()
                .seller(seller)
                .category(category)
                .name("Test Product " + nano)
                .slug("test-prod-" + nano)
                .description("Quality Product")
                .price(new BigDecimal("1000.00"))
                .stockQuantity(initialStock)
                .status(Product.Status.APPROVED)
                .build());

        // Customer adds item to cart
        cartService.addItem(customer.getId(), new CartItemRequest(product.getId(), orderQuantity));

        // Create order
        OrderResponse orderResp = orderService.placeOrder(customer.getId(), new OrderRequest(customerAddress.getId(), null));

        // Initiate and verify Razorpay payment
        GatewayOrderDto gwDto = paymentService.createGatewayOrder(customer.getId(), new CreateGatewayOrderRequest(orderResp.id()));
        paymentService.verifyGatewayPayment(customer.getId(), new VerifyPaymentRequest(
                orderResp.id(),
                gwDto.gatewayOrderId(),
                paymentId,
                "valid_test_signature"
        ));

        // Transition order to DELIVERED so customer can request return
        Order order = orderRepository.findByIdWithItems(orderResp.id()).orElseThrow();
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        OrderItem orderItem = order.getItems().get(0);

        // Customer requests return
        ReturnResponse retResponse = returnService.requestReturn(
                new CreateReturnRequest(order.getId(), orderItem.getId(), "Defective item", "Screen flickering"),
                customer
        );

        return new TestSetup(order, orderItem, product, retResponse);
    }

    @Test
    @DisplayName("Scenario 1: Repeated approval after REFUNDED is idempotent and does not trigger second gateway refund")
    void test1_repeatedApprovalAfterRefunded_isIdempotent() {
        TestSetup setup = createPurchasedAndReturnedTestOrder(sellerA, "pay_repeat_refunded_1", 20, 2);
        int initialStockBeforeReturn = productRepository.findById(setup.product().getId()).orElseThrow().getStockQuantity();

        mockPaymentGatewayService.resetRefundCallCount();

        // First Approval by Seller
        ReturnResponse firstResp = returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA);
        assertThat(firstResp.status()).isEqualTo("COMPLETED");
        assertThat(firstResp.refund()).isNotNull();
        assertThat(firstResp.refund().refundStatus()).isEqualTo("REFUNDED");
        assertThat(mockPaymentGatewayService.getRefundCallCount()).isEqualTo(1);

        int stockAfterFirstApproval = productRepository.findById(setup.product().getId()).orElseThrow().getStockQuantity();
        assertThat(stockAfterFirstApproval).isEqualTo(initialStockBeforeReturn + 2);

        // Second Approval by Seller on the same return
        ReturnResponse secondResp = returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA);
        assertThat(secondResp.status()).isEqualTo("COMPLETED");
        assertThat(secondResp.refund()).isNotNull();
        assertThat(secondResp.refund().refundStatus()).isEqualTo("REFUNDED");
        assertThat(secondResp.refund().refundTransactionId()).isEqualTo(firstResp.refund().refundTransactionId());

        // Assert: Gateway was NOT called again
        assertThat(mockPaymentGatewayService.getRefundCallCount()).isEqualTo(1);

        // Assert: Stock was NOT incremented again
        int stockAfterSecondApproval = productRepository.findById(setup.product().getId()).orElseThrow().getStockQuantity();
        assertThat(stockAfterSecondApproval).isEqualTo(stockAfterFirstApproval);
    }

    @Test
    @DisplayName("Scenario 2: Repeated approval after REFUND_PROCESSING does not trigger a second gateway refund")
    void test2_repeatedApprovalAfterRefundProcessing_doesNotTriggerSecondGatewayRefund() {
        // "pay_processing_refund" tells MockPaymentGatewayService to return status "processing"
        TestSetup setup = createPurchasedAndReturnedTestOrder(sellerA, "pay_processing_refund", 15, 1);
        mockPaymentGatewayService.resetRefundCallCount();

        // First approval puts refund into REFUND_PROCESSING
        ReturnResponse firstResp = returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA);
        assertThat(firstResp.refund().refundStatus()).isEqualTo("REFUND_PROCESSING");
        assertThat(mockPaymentGatewayService.getRefundCallCount()).isEqualTo(1);

        // Second approval while still in REFUND_PROCESSING
        ReturnResponse secondResp = returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA);
        assertThat(secondResp.refund()).isNotNull();

        // Crucial Check: Second gateway call was strictly PREVENTED
        assertThat(mockPaymentGatewayService.getRefundCallCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Scenario 3: Two simultaneous approval requests are serialized and processed at most once")
    void test3_twoSimultaneousApprovalRequests_processedAtMostOnce() throws Exception {
        TestSetup setup = createPurchasedAndReturnedTestOrder(sellerA, "pay_concurrent_refund_1", 50, 3);
        int initialStock = productRepository.findById(setup.product().getId()).orElseThrow().getStockQuantity();

        mockPaymentGatewayService.resetRefundCallCount();

        int numThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CountDownLatch readyLatch = new CountDownLatch(numThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        List<Future<ReturnResponse>> futures = new ArrayList<>();

        for (int i = 0; i < numThreads; i++) {
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                startLatch.await();
                return returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA);
            }));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Release both threads at the exact same instant

        for (Future<ReturnResponse> f : futures) {
            ReturnResponse r = f.get(10, TimeUnit.SECONDS);
            assertThat(r).isNotNull();
            assertThat(r.refund()).isNotNull();
        }
        executor.shutdown();

        // Gateway must have been invoked exactly ONCE
        assertThat(mockPaymentGatewayService.getRefundCallCount()).isEqualTo(1);

        // Inventory must have been restored exactly ONCE (+3 items, not +6 items)
        int finalStock = productRepository.findById(setup.product().getId()).orElseThrow().getStockQuantity();
        assertThat(finalStock).isEqualTo(initialStock + 3);

        // Database must contain only ONE Refund entity for this return
        List<Refund> refunds = refundRepository.findAll().stream()
                .filter(ref -> ref.getReturnRequest().getId().equals(setup.returnResponse().id()))
                .toList();
        assertThat(refunds).hasSize(1);
    }

    @Test
    @DisplayName("Scenario 4: Gateway timeout after refund submission is recorded safely as REFUND_PROCESSING without duplicate submission")
    void test4_gatewayTimeoutAfterRefundSubmission_handledSafelyWithoutBlindResubmission() {
        // "pay_timeout_refund" triggers a network timeout exception during refund submission
        TestSetup setup = createPurchasedAndReturnedTestOrder(sellerA, "pay_timeout_refund", 10, 1);
        mockPaymentGatewayService.resetRefundCallCount();

        // Seller approves refund; gateway times out
        ReturnResponse timeoutResp = returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA);

        assertThat(timeoutResp.refund()).isNotNull();
        assertThat(timeoutResp.refund().refundStatus()).isEqualTo("REFUND_PROCESSING");
        assertThat(mockPaymentGatewayService.getRefundCallCount()).isEqualTo(1);

        // Verify entity state in DB
        ReturnRequest inDb = returnRequestRepository.findById(setup.returnResponse().id()).orElseThrow();
        assertThat(inDb.getStatus()).isEqualTo(ReturnStatus.REFUND_INITIATED);

        // Seller attempts approval again after timeout
        ReturnResponse retryResp = returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA);

        // Must NOT blindly resubmit to gateway!
        assertThat(retryResp.refund().refundStatus()).isEqualTo("REFUND_PROCESSING");
        assertThat(mockPaymentGatewayService.getRefundCallCount()).isEqualTo(1);

        // Gateway now reports processed; reconciliation transitions it to REFUNDED without second gateway refund
        mockPaymentGatewayService.registerRefundDetails(timeoutResp.refund().providerRefundId(),
                com.securecommerce.platform.payment.gateway.GatewayRefundResponse.builder()
                        .refundId(timeoutResp.refund().providerRefundId())
                        .status("processed")
                        .currency("INR")
                        .build());

        ReturnResponse reconciledResp = returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA);
        assertThat(reconciledResp.refund().refundStatus()).isEqualTo("REFUNDED");
        assertThat(reconciledResp.status()).isEqualTo("COMPLETED");
        assertThat(mockPaymentGatewayService.getRefundCallCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Scenario 5: Duplicate refund.processed webhook reconciles idempotently")
    void test5_duplicateRefundWebhook_processedIdempotently() {
        TestSetup setup = createPurchasedAndReturnedTestOrder(sellerA, "pay_webhook_dup_refund_1", 25, 2);

        // 1. First approval sets in-flight
        ReturnResponse initialApproval = returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA);
        String refundProviderId = initialApproval.refund().providerRefundId();

        // 2. Fire first refund.processed webhook
        String webhookPayload = String.format("""
            {
                "event": "refund.processed",
                "payload": {
                    "refund": {
                        "entity": {
                            "id": "%s",
                            "payment_id": "pay_webhook_dup_refund_1",
                            "amount": 200000,
                            "currency": "INR",
                            "status": "processed"
                        }
                    }
                }
            }
            """, refundProviderId);

        paymentService.processWebhook(webhookPayload, "valid_test_webhook_sig", "evt_rfnd_processed_dup_1");

        Payment p1 = paymentRepository.findByProviderPaymentId("pay_webhook_dup_refund_1").orElseThrow();
        assertThat(p1.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);

        ReturnRequest r1 = returnRequestRepository.findById(setup.returnResponse().id()).orElseThrow();
        assertThat(r1.getStatus()).isEqualTo(ReturnStatus.COMPLETED);

        // 3. Fire duplicate refund.processed webhook with the same event
        paymentService.processWebhook(webhookPayload, "valid_test_webhook_sig", "evt_rfnd_processed_dup_1");

        // 4. Fire again with another event ID
        paymentService.processWebhook(webhookPayload, "valid_test_webhook_sig", "evt_rfnd_processed_dup_2");

        Payment p2 = paymentRepository.findByProviderPaymentId("pay_webhook_dup_refund_1").orElseThrow();
        assertThat(p2.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);

        ReturnRequest r2 = returnRequestRepository.findById(setup.returnResponse().id()).orElseThrow();
        assertThat(r2.getStatus()).isEqualTo(ReturnStatus.COMPLETED);
    }

    @Test
    @DisplayName("Scenario 6: Seller rejection blocks subsequent approval and prevents any gateway refund")
    void test6_sellerRejection_blocksSubsequentApproval() {
        TestSetup setup = createPurchasedAndReturnedTestOrder(sellerA, "pay_rejection_test_1", 10, 1);
        mockPaymentGatewayService.resetRefundCallCount();

        // Seller rejects refund request
        ReturnResponse rejectResp = returnService.rejectRefundAsSeller(
                setup.returnResponse().id(),
                new RejectReturnRequest("Item seal broken by customer"),
                sellerA
        );

        assertThat(rejectResp.status()).isEqualTo("REJECTED");
        assertThat(rejectResp.sellerApprovalStatus()).isEqualTo("SELLER_REJECTED");
        assertThat(mockPaymentGatewayService.getRefundCallCount()).isEqualTo(0);

        // Attempting to approve rejected request must throw 400 Bad Request
        assertThatThrownBy(() -> returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("already been rejected");
                });

        // Zero gateway refunds issued
        assertThat(mockPaymentGatewayService.getRefundCallCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("Scenario 7: Unauthorized seller approval throws 403 FORBIDDEN and preserves state")
    void test7_unauthorizedSellerApproval_returns403Forbidden() {
        TestSetup setup = createPurchasedAndReturnedTestOrder(sellerA, "pay_unauth_test_1", 10, 1);
        mockPaymentGatewayService.resetRefundCallCount();

        // Seller B tries to approve Seller A's return
        assertThatThrownBy(() -> returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerB))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("not authorized to approve");
                });

        // Verify status unchanged
        ReturnRequest unchanged = returnRequestRepository.findById(setup.returnResponse().id()).orElseThrow();
        assertThat(unchanged.getStatus()).isNotEqualTo(ReturnStatus.COMPLETED);
        assertThat(mockPaymentGatewayService.getRefundCallCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("Scenario 8: Product inventory is restored only once across approval and repeated attempts")
    void test8_inventoryRestoredOnlyOnce() {
        int initialStock = 100;
        int orderQty = 5;
        TestSetup setup = createPurchasedAndReturnedTestOrder(sellerA, "pay_inventory_single_1", initialStock, orderQty);

        // Stock immediately after purchase: 100 - 5 = 95
        int stockAfterPurchase = productRepository.findById(setup.product().getId()).orElseThrow().getStockQuantity();
        assertThat(stockAfterPurchase).isEqualTo(initialStock - orderQty);

        // Seller approves refund -> stock should be restored to initialStock (95 + 5 = 100)
        returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA);
        int stockAfterFirstApproval = productRepository.findById(setup.product().getId()).orElseThrow().getStockQuantity();
        assertThat(stockAfterFirstApproval).isEqualTo(initialStock);

        // Repeated approval attempt
        returnService.approveRefundAsSeller(setup.returnResponse().id(), sellerA);
        int stockAfterSecondApproval = productRepository.findById(setup.product().getId()).orElseThrow().getStockQuantity();
        assertThat(stockAfterSecondApproval).isEqualTo(initialStock); // Still 100, NEVER 105
    }
}
