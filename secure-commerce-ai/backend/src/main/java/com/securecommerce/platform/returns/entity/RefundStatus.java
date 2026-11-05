package com.securecommerce.platform.returns.entity;

/**
 * RefundStatus — Multi-stage lifecycle of customer refund requests.
 */
public enum RefundStatus {
    REFUND_REQUESTED,
    REFUND_PROCESSING,
    REFUNDED,
    REFUND_FAILED,

    // Historical backward compatibility
    PENDING,
    SUCCESS,
    FAILED
}
