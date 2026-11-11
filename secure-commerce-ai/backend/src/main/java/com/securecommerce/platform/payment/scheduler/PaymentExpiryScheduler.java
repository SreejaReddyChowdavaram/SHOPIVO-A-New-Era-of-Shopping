package com.securecommerce.platform.payment.scheduler;

import com.securecommerce.platform.notification.entity.NotificationType;
import com.securecommerce.platform.notification.service.NotificationService;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderItem;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * PaymentExpiryScheduler — Periodically cancels expired PENDING orders and idempotently restores inventory.
 *
 * Enforces requirement 6:
 * - Expired PENDING orders must be cancelled and stock restored exactly once.
 * - The operation is idempotent.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentExpiryScheduler {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedDelay = 60000) // Runs every 60 seconds
    @Transactional
    public int processExpiredOrders() {
        Instant now = Instant.now();
        List<Order> expiredOrders = orderRepository.findExpiredOrdersWithItems(OrderStatus.PENDING, now);

        if (expiredOrders.isEmpty()) {
            return 0;
        }

        int count = 0;
        for (Order order : expiredOrders) {
            // Guard: Double check status to guarantee idempotency
            if (order.getStatus() != OrderStatus.PENDING) {
                continue;
            }

            log.info("Processing expiry for order #{}: expired at {}, current time {}",
                    order.getId(), order.getPaymentExpiresAt(), now);

            // 1. Atomically restore product stock
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    Product product = item.getProduct();
                    if (product != null) {
                        product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                        productRepository.save(product);
                        log.debug("Restored {} units of stock for product #{}", item.getQuantity(), product.getId());
                    }
                }
            }

            // 2. Mark order as CANCELLED
            order.setStatus(OrderStatus.CANCELLED);
            order.setCancellationReason("Payment window expired (auto-cancelled)");
            order.setCancelledAt(now);
            orderRepository.save(order);

            // 3. Mark any INITIATED payments as CANCELLED
            List<Payment> initiatedPayments = paymentRepository.findAllByOrderIdOrderByCreatedAtDesc(order.getId()).stream()
                    .filter(p -> p.getPaymentStatus() == PaymentStatus.INITIATED)
                    .toList();

            for (Payment payment : initiatedPayments) {
                payment.setPaymentStatus(PaymentStatus.CANCELLED);
                payment.setFailureReason("Payment session expired. Please generate a new payment QR code.");
                paymentRepository.save(payment);
            }

            // 4. Notify customer
            try {
                if (order.getCustomer() != null) {
                    notificationService.createNotification(
                            order.getCustomer(),
                            NotificationType.ORDER_CANCELLED,
                            "Order Cancelled Due to Payment Timeout",
                            String.format("Order #%d was automatically cancelled because payment was not completed within the allowed time.", order.getId()),
                            "ORDER",
                            order.getId()
                    );
                }
            } catch (Exception e) {
                log.warn("Failed to send cancellation notification for expired order #{}: {}", order.getId(), e.getMessage());
            }

            count++;
        }

        if (count > 0) {
            log.info("PaymentExpiryScheduler: successfully cancelled {} expired orders and restored stock.", count);
        }
        return count;
    }
}
