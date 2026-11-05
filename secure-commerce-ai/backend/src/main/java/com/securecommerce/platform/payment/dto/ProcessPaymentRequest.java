package com.securecommerce.platform.payment.dto;

import com.securecommerce.platform.payment.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

/**
 * ProcessPaymentRequest — Input DTO for simulated sandbox payment processing.
 * Accepts transient card/UPI simulation parameters which are never stored in plain text.
 */
public record ProcessPaymentRequest(
        @NotNull(message = "Order ID is required")
        Long orderId,

        @NotNull(message = "Payment method is required")
        PaymentMethod paymentMethod,

        // Transient simulation fields
        String cardNumber,
        String cardExpiry,
        String cardCvv,
        String upiId,
        String bankCode,
        Boolean simulateFailure
) {}
