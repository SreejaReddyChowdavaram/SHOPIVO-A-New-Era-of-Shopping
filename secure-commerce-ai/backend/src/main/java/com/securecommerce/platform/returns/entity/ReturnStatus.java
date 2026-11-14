package com.securecommerce.platform.returns.entity;

public enum ReturnStatus {
    REQUESTED,
    PENDING_SELLER_APPROVAL,
    SELLER_APPROVED,
    SELLER_REJECTED,
    REFUND_INITIATED,
    APPROVED,
    REJECTED,
    COMPLETED,
    CANCELLED
}
