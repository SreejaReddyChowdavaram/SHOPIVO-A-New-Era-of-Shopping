package com.securecommerce.platform.event.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.event.dto.EventResponse;
import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.entity.UserEvent;
import com.securecommerce.platform.event.repository.UserEventRepository;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.returns.entity.Refund;
import com.securecommerce.platform.returns.entity.ReturnRequest;
import com.securecommerce.platform.returns.repository.RefundRepository;
import com.securecommerce.platform.returns.repository.ReturnRequestRepository;
import com.securecommerce.platform.review.entity.Review;
import com.securecommerce.platform.review.repository.ReviewRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.util.List;

/**
 * AdminEventController — Admin endpoints for research event exploration and dataset extraction.
 *
 * Provides research access to persistent event logs and raw datasets for Semester 2 ML model training.
 */
@Slf4j
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminEventController {

    private final UserEventRepository userEventRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final RefundRepository refundRepository;
    private final ReviewRepository reviewRepository;

    /**
     * GET /api/admin/events — Query and inspect recorded events.
     */
    @GetMapping("/events")
    public ResponseEntity<ApiResponse<Page<EventResponse>>> getEvents(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) EventType eventType,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Page<UserEvent> events = userEventRepository.searchEvents(
                userId, eventType, startDate, endDate,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "eventTimestamp"))
        );
        Page<EventResponse> response = events.map(EventResponse::from);
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", response));
    }

    /**
     * GET /api/admin/events/export — Export event records to CSV.
     */
    @GetMapping(value = "/events/export", produces = "text/csv")
    public ResponseEntity<String> exportEventsCsv(
            @RequestParam(required = false) EventType eventType,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate
    ) {
        List<UserEvent> list = userEventRepository.findForExport(eventType, startDate, endDate);

        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        pw.println("id,user_id,user_email,event_type,event_timestamp,session_id,reference_type,reference_id,ip_address,user_agent,metadata,created_at");

        for (UserEvent e : list) {
            pw.printf("%d,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s%n",
                    e.getId(),
                    e.getUserId() != null ? e.getUserId() : "",
                    csvEscape(e.getUserEmail()),
                    e.getEventType().name(),
                    e.getEventTimestamp(),
                    csvEscape(e.getSessionId()),
                    csvEscape(e.getReferenceType()),
                    csvEscape(e.getReferenceId()),
                    csvEscape(e.getIpAddress()),
                    csvEscape(e.getUserAgent()),
                    csvEscape(e.getMetadata()),
                    e.getCreatedAt()
            );
        }
        pw.flush();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"events.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(sw.toString());
    }

    /**
     * GET /api/admin/export/{dataset} — Unified research dataset exporter.
     * Supported datasets: events, orders, payments, users, returns, refunds, reviews
     */
    @GetMapping(value = "/export/{dataset}", produces = "text/csv")
    public ResponseEntity<String> exportDataset(@PathVariable String dataset) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);

        switch (dataset.toLowerCase()) {
            case "events" -> {
                return exportEventsCsv(null, null, null);
            }
            case "orders" -> {
                pw.println("id,customer_id,status,total_amount,payment_expires_at,shipping_city,shipping_country,created_at");
                List<Order> orders = orderRepository.findAll();
                for (Order o : orders) {
                    pw.printf("%d,%d,%s,%s,%s,%s,%s,%s%n",
                            o.getId(),
                            o.getCustomer().getId(),
                            o.getStatus().name(),
                            o.getTotalAmount(),
                            o.getPaymentExpiresAt() != null ? o.getPaymentExpiresAt() : "",
                            csvEscape(o.getShippingCity()),
                            csvEscape(o.getShippingCountry()),
                            o.getCreatedAt()
                    );
                }
            }
            case "payments" -> {
                pw.println("id,order_id,customer_id,provider,payment_method,payment_status,amount,transaction_id,gateway_method,card_last4,failure_reason,created_at");
                List<Payment> payments = paymentRepository.findAll();
                for (Payment p : payments) {
                    pw.printf("%d,%d,%d,%s,%s,%s,%s,%s,%s,%s,%s,%s%n",
                            p.getId(),
                            p.getOrder().getId(),
                            p.getCustomer().getId(),
                            p.getProvider(),
                            p.getPaymentMethod().name(),
                            p.getPaymentStatus().name(),
                            p.getAmount(),
                            csvEscape(p.getTransactionId()),
                            csvEscape(p.getGatewayMethod()),
                            csvEscape(p.getCardLast4()),
                            csvEscape(p.getFailureReason()),
                            p.getCreatedAt()
                    );
                }
            }
            case "users" -> {
                pw.println("id,email,first_name,last_name,role,enabled,created_at");
                List<User> users = userRepository.findAll();
                for (User u : users) {
                    pw.printf("%d,%s,%s,%s,%s,%b,%s%n",
                            u.getId(),
                            csvEscape(u.getEmail()),
                            csvEscape(u.getFirstName()),
                            csvEscape(u.getLastName()),
                            u.getRole().name(),
                            u.isEnabled(),
                            u.getCreatedAt()
                    );
                }
            }
            case "returns" -> {
                pw.println("id,order_id,customer_id,status,refund_amount,reason,created_at");
                List<ReturnRequest> returns = returnRequestRepository.findAll();
                for (ReturnRequest r : returns) {
                    pw.printf("%d,%d,%d,%s,%s,%s,%s%n",
                            r.getId(),
                            r.getOrder().getId(),
                            r.getCustomer().getId(),
                            r.getStatus().name(),
                            r.getRefundAmount(),
                            csvEscape(r.getReason()),
                            r.getCreatedAt()
                    );
                }
            }
            case "refunds" -> {
                pw.println("id,order_id,customer_id,status,refund_amount,transaction_id,payment_method,processed_at");
                List<Refund> refunds = refundRepository.findAll();
                for (Refund r : refunds) {
                    pw.printf("%d,%d,%d,%s,%s,%s,%s,%s%n",
                            r.getId(),
                            r.getOrder().getId(),
                            r.getCustomer().getId(),
                            r.getRefundStatus().name(),
                            r.getRefundAmount(),
                            csvEscape(r.getRefundTransactionId()),
                            r.getPaymentMethod() != null ? r.getPaymentMethod().name() : "",
                            r.getProcessedAt() != null ? r.getProcessedAt() : ""
                    );
                }
            }
            case "reviews" -> {
                pw.println("id,product_id,customer_id,order_id,rating,verified_purchase,created_at");
                List<Review> reviews = reviewRepository.findAll();
                for (Review r : reviews) {
                    pw.printf("%d,%d,%d,%d,%d,%b,%s%n",
                            r.getId(),
                            r.getProduct().getId(),
                            r.getCustomer().getId(),
                            r.getOrder() != null ? r.getOrder().getId() : 0,
                            r.getRating(),
                            r.isVerifiedPurchase(),
                            r.getCreatedAt()
                    );
                }
            }
            default -> {
                return ResponseEntity.badRequest()
                        .body("Unknown dataset: " + dataset + ". Valid options: events, orders, payments, users, returns, refunds, reviews");
            }
        }

        pw.flush();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + dataset + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(sw.toString());
    }

    private String csvEscape(String val) {
        if (val == null) return "";
        String s = val.replace("\"", "\"\"");
        if (s.contains(",") || s.contains("\n") || s.contains("\r") || s.contains("\"")) {
            return "\"" + s + "\"";
        }
        return s;
    }
}
