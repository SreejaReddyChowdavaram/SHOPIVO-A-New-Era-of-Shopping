package com.securecommerce.platform.payment.entity;

/**
 * PaymentMethod — High-level customer payment option.
 *
 * RAZORPAY: Online payment gateway (Card, UPI, Net Banking chosen in gateway modal)
 * COD: Cash on Delivery (Non-gateway settlement)
 *
 * CARD, UPI, NET_BANKING: Retained for backward compatibility with historical demo records.
 */
public enum PaymentMethod {
    RAZORPAY,
    COD,

    // Historical records backward compatibility
    CARD,
    UPI,
    NET_BANKING
}
