package com.securecommerce.platform.order.dto;

import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.payment.entity.PaymentMethod;
import com.securecommerce.platform.payment.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * AdminOrderListItemResponse — Lightweight DTO for paged order listing on the Admin Operations console.
 */
public record AdminOrderListItemResponse(
        Long id,
        Long customerId,
        String customerName,
        String customerEmail,
        Instant createdAt,
        BigDecimal totalAmount,
        int totalItems,
        OrderStatus status,
        PaymentStatus paymentStatus,
        PaymentMethod paymentMethod,
        int sellerCount,
        String cancellationReason
) {}
