package com.securecommerce.platform.payment.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.payment.dto.PaymentResponse;
import com.securecommerce.platform.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * AdminPaymentController — Oversight and audit trail for all platform payment transactions.
 * Scoped strictly to ADMIN role.
 * Base path: /admin/payments (mapped under /api/admin/payments)
 */
@RestController
@RequestMapping("/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    private final PaymentService paymentService;

    /**
     * GET /api/admin/payments
     * Paginated audit listing of all platform payments.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        int pageSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
        Page<PaymentResponse> payments = paymentService.getAllPaymentsForAdmin(pageable);
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved", payments));
    }
}
