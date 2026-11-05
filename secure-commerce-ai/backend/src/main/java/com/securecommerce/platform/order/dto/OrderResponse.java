package com.securecommerce.platform.order.dto;

import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderItem;
import com.securecommerce.platform.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        Long customerId,
        String customerName,
        String customerEmail,
        ShippingAddressSnapshot shippingAddress,
        OrderStatus status,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        String couponCode,
        BigDecimal totalAmount,
        int totalItems,
        List<OrderItemResponse> items,
        String cancellationReason,
        Instant cancelledAt,
        Instant createdAt,
        Instant updatedAt
) {

    public record ShippingAddressSnapshot(
            String fullName,
            String phone,
            String line1,
            String line2,
            String city,
            String state,
            String postalCode,
            String country
    ) {}

    public record OrderItemResponse(
            Long id,
            Long productId,
            Long sellerId,
            String productName,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal lineTotal,
            String imageUrl
    ) {
        public static OrderItemResponse from(OrderItem item) {
            String imageUrl = item.getProduct() != null ? item.getProduct().getImageUrl() : null;
            return new OrderItemResponse(
                    item.getId(),
                    item.getProduct() != null ? item.getProduct().getId() : null,
                    item.getSeller() != null ? item.getSeller().getId() : null,
                    item.getProductNameSnapshot(),
                    item.getPriceSnapshot(),
                    item.getQuantity(),
                    item.getLineTotal(),
                    imageUrl
            );
        }
    }

    public static OrderResponse from(Order order) {
        ShippingAddressSnapshot address = new ShippingAddressSnapshot(
                order.getShippingFullName(),
                order.getShippingPhone(),
                order.getShippingLine1(),
                order.getShippingLine2(),
                order.getShippingCity(),
                order.getShippingState(),
                order.getShippingPostalCode(),
                order.getShippingCountry()
        );

        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(OrderItemResponse::from)
                .toList();

        int totalItems = itemResponses.stream()
                .mapToInt(OrderItemResponse::quantity)
                .sum();

        String customerName = order.getCustomer() != null
                ? order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName()
                : "Customer";

        String customerEmail = order.getCustomer() != null
                ? order.getCustomer().getEmail()
                : "";

        BigDecimal subtotal = order.getSubtotalAmount() != null
                ? order.getSubtotalAmount()
                : order.getTotalAmount();

        return new OrderResponse(
                order.getId(),
                order.getCustomer() != null ? order.getCustomer().getId() : null,
                customerName,
                customerEmail,
                address,
                order.getStatus(),
                subtotal,
                order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO,
                order.getCouponCode(),
                order.getTotalAmount(),
                totalItems,
                itemResponses,
                order.getCancellationReason(),
                order.getCancelledAt(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    /**
     * Builds a seller-scoped OrderResponse containing ONLY line items belonging to the given seller.
     */
    public static OrderResponse fromForSeller(Order order, Long sellerId) {
        ShippingAddressSnapshot address = new ShippingAddressSnapshot(
                order.getShippingFullName(),
                order.getShippingPhone(),
                order.getShippingLine1(),
                order.getShippingLine2(),
                order.getShippingCity(),
                order.getShippingState(),
                order.getShippingPostalCode(),
                order.getShippingCountry()
        );

        List<OrderItemResponse> sellerItems = order.getItems().stream()
                .filter(item -> item.getSeller() != null && item.getSeller().getId().equals(sellerId))
                .map(OrderItemResponse::from)
                .toList();

        BigDecimal sellerTotal = sellerItems.stream()
                .map(OrderItemResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = sellerItems.stream()
                .mapToInt(OrderItemResponse::quantity)
                .sum();

        String customerName = order.getCustomer() != null
                ? order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName()
                : "Customer";

        String customerEmail = order.getCustomer() != null
                ? order.getCustomer().getEmail()
                : "";

        return new OrderResponse(
                order.getId(),
                order.getCustomer() != null ? order.getCustomer().getId() : null,
                customerName,
                customerEmail,
                address,
                order.getStatus(),
                sellerTotal,
                BigDecimal.ZERO,
                null,
                sellerTotal,
                totalItems,
                sellerItems,
                order.getCancellationReason(),
                order.getCancelledAt(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
