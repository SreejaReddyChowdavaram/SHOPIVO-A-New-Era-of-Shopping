package com.securecommerce.platform.order.service;

import com.securecommerce.platform.user.entity.User;

public interface InvoiceService {

    /**
     * Generates a professional PDF invoice for the specified order.
     * Enforces customer ownership and loads authoritative snapshot data.
     *
     * @param orderId ID of the order
     * @param requester Authenticated user requesting the invoice
     * @return Byte array containing the generated PDF document
     */
    byte[] generateInvoicePdf(Long orderId, User requester);
}
