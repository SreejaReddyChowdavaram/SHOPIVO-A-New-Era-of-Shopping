package com.securecommerce.platform.payment.entity;

/**
 * PaymentStatus — Monotonic lifecycle of a financial payment transaction.
 *
 * Distinct from OrderStatus (physical delivery lifecycle) and
 * FraudRiskStatus (Semester 2 AI/CSGAD security evaluation).
 */
public enum PaymentStatus {
    INITIATED,
    SUCCESS,
    FAILED,
    REFUND_REQUESTED,
    REFUND_PROCESSING,
    REFUNDED,
    CANCELLED;

    /**
     * Enforces monotonic forward transitions to protect against out-of-order webhooks.
     */
    public boolean canTransitionTo(PaymentStatus target) {
        if (this == target) return true;

        return switch (this) {
            case INITIATED -> target == SUCCESS || target == FAILED || target == CANCELLED;
            case SUCCESS -> target == REFUND_REQUESTED || target == REFUND_PROCESSING || target == REFUNDED;
            case REFUND_REQUESTED -> target == REFUND_PROCESSING || target == REFUNDED || target == FAILED;
            case REFUND_PROCESSING -> target == REFUNDED || target == FAILED;
            case FAILED, REFUNDED, CANCELLED -> false;
        };
    }
}
