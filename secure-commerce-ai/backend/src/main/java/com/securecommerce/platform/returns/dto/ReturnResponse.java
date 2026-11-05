package com.securecommerce.platform.returns.dto;

import com.securecommerce.platform.returns.entity.Refund;
import com.securecommerce.platform.returns.entity.ReturnRequest;

import java.math.BigDecimal;
import java.time.Instant;

public record ReturnResponse(
        Long id,
        Long orderId,
        Long customerId,
        String customerName,
        Long orderItemId,
        String productName,
        String productImageUrl,
        String reason,
        String returnNote,
        String status,
        BigDecimal refundAmount,
        Instant requestedAt,
        Instant approvedAt,
        Instant rejectedAt,
        Instant completedAt,
        RefundResponse refund
) {
    public static ReturnResponse from(ReturnRequest req, Refund refund) {
        String prodName = null;
        String prodImage = null;
        Long itemId = null;

        if (req.getOrderItem() != null) {
            itemId = req.getOrderItem().getId();
            prodName = req.getOrderItem().getProductNameSnapshot();
            if (req.getOrderItem().getProduct() != null) {
                prodImage = req.getOrderItem().getProduct().getImageUrl();
            }
        } else if (req.getOrder() != null && req.getOrder().getItems() != null && !req.getOrder().getItems().isEmpty()) {
            prodName = req.getOrder().getItems().get(0).getProductNameSnapshot() +
                    (req.getOrder().getItems().size() > 1 ? " and " + (req.getOrder().getItems().size() - 1) + " more" : "");
            if (req.getOrder().getItems().get(0).getProduct() != null) {
                prodImage = req.getOrder().getItems().get(0).getProduct().getImageUrl();
            }
        }

        String custName = req.getCustomer() != null ? req.getCustomer().getFullName() : "Customer";

        return new ReturnResponse(
                req.getId(),
                req.getOrder() != null ? req.getOrder().getId() : null,
                req.getCustomer() != null ? req.getCustomer().getId() : null,
                custName,
                itemId,
                prodName,
                prodImage,
                req.getReason(),
                req.getReturnNote(),
                req.getStatus().name(),
                req.getRefundAmount(),
                req.getRequestedAt(),
                req.getApprovedAt(),
                req.getRejectedAt(),
                req.getCompletedAt(),
                RefundResponse.from(refund)
        );
    }
}
