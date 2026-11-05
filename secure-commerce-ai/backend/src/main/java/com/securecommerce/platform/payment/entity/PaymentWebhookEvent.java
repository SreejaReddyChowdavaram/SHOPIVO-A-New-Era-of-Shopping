package com.securecommerce.platform.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * PaymentWebhookEvent.java — Event-level idempotency and audit log for gateway webhooks.
 *
 * Prevents duplicate processing of multiple webhook deliveries (e.g. payment.captured,
 * payment.authorized, refund.processed) and guards against out-of-order state overwrites.
 */
@Entity
@Table(name = "payment_webhook_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentWebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String provider = "RAZORPAY";

    /**
     * Unique Provider Event ID (from X-Razorpay-Event-Id header or payload event ID).
     */
    @Column(name = "event_id", nullable = false, unique = true, length = 100)
    private String eventId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    /**
     * Internal audit snapshot (never exposed to customers).
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "processing_status", nullable = false, length = 30)
    private String processingStatus; // RECEIVED, PROCESSED, IGNORED_DUPLICATE, IGNORED_OUT_OF_ORDER, FAILED

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "processed_at")
    private Instant processedAt;
}
