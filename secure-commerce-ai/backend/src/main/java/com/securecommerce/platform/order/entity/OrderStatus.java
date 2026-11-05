package com.securecommerce.platform.order.entity;

import com.securecommerce.platform.user.entity.User;

import java.util.List;
import java.util.Map;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED;

    private static final Map<OrderStatus, List<OrderStatus>> FORWARD_TRANSITIONS = Map.of(
            PENDING, List.of(CONFIRMED, CANCELLED),
            CONFIRMED, List.of(PROCESSING, CANCELLED),
            PROCESSING, List.of(SHIPPED, CANCELLED),
            SHIPPED, List.of(DELIVERED, CANCELLED),
            DELIVERED, List.of(),
            CANCELLED, List.of()
    );

    /**
     * Determines if a transition from current status to next status is permitted for the given role.
     * Admin can cancel or advance any status forward.
     * Seller can advance forward (CONFIRMED -> PROCESSING -> SHIPPED).
     */
    public boolean canTransitionTo(OrderStatus next, User.Role role) {
        if (this == next) return true;
        if (this == DELIVERED || this == CANCELLED) return false; // terminal states

        if (role == User.Role.ADMIN) {
            return FORWARD_TRANSITIONS.getOrDefault(this, List.of()).contains(next);
        }

        if (role == User.Role.SELLER) {
            if (next == CANCELLED) return false; // Sellers cannot unilaterally cancel the entire multi-item order
            return FORWARD_TRANSITIONS.getOrDefault(this, List.of()).contains(next);
        }

        return false;
    }
}
