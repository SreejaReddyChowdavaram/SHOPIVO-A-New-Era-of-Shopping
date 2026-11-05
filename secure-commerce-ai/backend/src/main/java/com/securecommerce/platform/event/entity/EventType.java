package com.securecommerce.platform.event.entity;

/**
 * EventType — Controlled vocabulary of user interactions and transactional milestones.
 *
 * Designed to capture user journey sequences for Semester 2 fraud research:
 * User -> Register/Login -> Search/Browse -> Cart -> Checkout -> Payment -> Order -> Return/Refund/Review
 */
public enum EventType {
    // ─── AUTH & USER ──────────────────────────────
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    LOGOUT,
    REGISTRATION,

    // ─── PRODUCT & BROWSING ───────────────────────
    PRODUCT_VIEW,
    PRODUCT_SEARCH,

    // ─── CART ─────────────────────────────────────
    CART_ITEM_ADDED,
    CART_ITEM_REMOVED,
    CART_ITEM_UPDATED,

    // ─── CHECKOUT ─────────────────────────────────
    CHECKOUT_STARTED,

    // ─── PAYMENT ──────────────────────────────────
    PAYMENT_ATTEMPTED,
    PAYMENT_SUCCESS,
    PAYMENT_FAILURE,

    // ─── ORDER ────────────────────────────────────
    ORDER_PLACED,
    ORDER_CANCELLED,

    // ─── RETURN & REFUND ──────────────────────────
    RETURN_REQUESTED,
    REFUND_CREATED,

    // ─── REVIEW ───────────────────────────────────
    REVIEW_SUBMITTED
}
