package com.securecommerce.platform.payment.gateway;

import lombok.Builder;

/**
 * GatewayQrCodeResponse — Direct response model from Razorpay QR Code API.
 * Captures official single-use dynamic UPI QR attributes or fallback trigger.
 */
@Builder
public record GatewayQrCodeResponse(
        String qrCodeId,
        String imageUrl,
        long amountInPaise,
        String currency,
        String status,
        Long closeBy,
        String fallbackMode,
        String fallbackReason
) {}

