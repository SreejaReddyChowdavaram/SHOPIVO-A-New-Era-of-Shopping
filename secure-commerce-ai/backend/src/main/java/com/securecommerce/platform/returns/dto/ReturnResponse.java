package com.securecommerce.platform.returns.dto;

import com.securecommerce.platform.returns.entity.Refund;
import com.securecommerce.platform.returns.entity.ReturnRequest;
import com.securecommerce.platform.user.entity.User;

import java.math.BigDecimal;
import java.time.Instant;

public record ReturnResponse(
        Long id,
        Long orderId,
        String orderReference,
        Long customerId,
        String customerName,
        String customerEmail,
        Long sellerId,
        String sellerName,
        String sellerApprovalStatus,
        Instant sellerApprovedAt,
        Instant sellerRejectedAt,
        String sellerRejectionReason,
        Long orderItemId,
        String productName,
        String productImageUrl,
        Integer quantity,
        BigDecimal orderTotal,
        String reason,
        String returnNote,
        String status,
        BigDecimal refundAmount,
        Instant requestedAt,
        Instant approvedAt,
        Instant rejectedAt,
        Instant completedAt,
        String refundDestination,
        String estimatedSettlement,
        String gatewayMode,
        RefundResponse refund
) {
    public static ReturnResponse from(ReturnRequest req, Refund refund) {
        return from(req, refund, "TEST");
    }

    public static ReturnResponse from(ReturnRequest req, Refund refund, String gatewayMode) {
        String prodName = null;
        String prodImage = null;
        Long itemId = null;
        Integer qty = 1;
        BigDecimal ordTotal = req.getOrder() != null ? req.getOrder().getTotalAmount() : req.getRefundAmount();
        String orderRef = req.getOrder() != null && req.getOrder().getOrderReference() != null
                ? req.getOrder().getOrderReference()
                : (req.getOrder() != null ? "SHV-" + req.getOrder().getId() : "SHV-ORD");

        if (req.getOrderItem() != null) {
            itemId = req.getOrderItem().getId();
            prodName = req.getOrderItem().getProductNameSnapshot();
            qty = req.getOrderItem().getQuantity();
            if (req.getOrderItem().getProduct() != null) {
                prodImage = req.getOrderItem().getProduct().getImageUrl();
            }
        } else if (req.getOrder() != null && req.getOrder().getItems() != null && !req.getOrder().getItems().isEmpty()) {
            var firstItem = req.getOrder().getItems().get(0);
            prodName = firstItem.getProductNameSnapshot() +
                    (req.getOrder().getItems().size() > 1 ? " and " + (req.getOrder().getItems().size() - 1) + " more" : "");
            qty = firstItem.getQuantity();
            if (firstItem.getProduct() != null) {
                prodImage = firstItem.getProduct().getImageUrl();
            }
        }

        String custName = req.getCustomer() != null ? req.getCustomer().getFullName() : "Customer";
        String custEmail = req.getCustomer() != null ? req.getCustomer().getEmail() : "";

        Long sId = req.getSeller() != null ? req.getSeller().getId() : null;
        String sName = req.getSeller() != null ? req.getSeller().getFullName() : null;
        if (sId == null && req.getOrderItem() != null && req.getOrderItem().getSeller() != null) {
            sId = req.getOrderItem().getSeller().getId();
            sName = req.getOrderItem().getSeller().getFullName();
        }

        String destExplanation = "Refunds are processed through Razorpay to the original payment method used during checkout. The time taken for the amount to appear depends on the payment method and banking network.";
        String est = "Typically 5-7 business days for Cards/NetBanking, Instant to 24 hrs for UPI";

        String sellerStatus = req.getSellerApprovalStatus();
        if (sellerStatus == null || sellerStatus.isBlank()) {
            sellerStatus = "PENDING_SELLER_APPROVAL";
        }

        return new ReturnResponse(
                req.getId(),
                req.getOrder() != null ? req.getOrder().getId() : null,
                orderRef,
                req.getCustomer() != null ? req.getCustomer().getId() : null,
                custName,
                custEmail,
                sId,
                sName,
                sellerStatus,
                req.getSellerApprovedAt(),
                req.getSellerRejectedAt(),
                req.getSellerRejectionReason(),
                itemId,
                prodName,
                prodImage,
                qty,
                ordTotal,
                req.getReason(),
                req.getReturnNote(),
                req.getStatus().name(),
                req.getRefundAmount(),
                req.getRequestedAt(),
                req.getApprovedAt(),
                req.getRejectedAt(),
                req.getCompletedAt(),
                destExplanation,
                est,
                gatewayMode != null ? gatewayMode : "TEST",
                RefundResponse.from(refund)
        );
    }
}
