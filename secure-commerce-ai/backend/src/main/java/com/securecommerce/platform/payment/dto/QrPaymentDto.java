package com.securecommerce.platform.payment.dto;

import lombok.Builder;

import java.math.BigDecimal;

/**
 * QrPaymentDto — Response payload sent to frontend when customer requests UPI QR payment.
 *
 * Supports two operational pathways:
 * 1. "RAZORPAY_QR_CODE": Standalone single-use dynamic QR image generated via Razorpay QR Code API.
 * 2. "STANDARD_CHECKOUT_FALLBACK": Seamless fallback to Razorpay Standard Checkout modal with Dynamic UPI QR.
 */
@Builder
public record QrPaymentDto(
        Long orderId,
        String orderReference,
        String mode,
        String qrCodeId,
        String imageUrl,
        BigDecimal amount,
        long amountInPaise,
        String currency,
        Long closeBy,
        String gatewayOrderId,
        String keyId,
        String customerName,
        String customerEmail,
        String customerPhone,
        String fallbackReason
) {}

