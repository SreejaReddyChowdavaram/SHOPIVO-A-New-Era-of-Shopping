package com.securecommerce.platform.event.entity;

import com.securecommerce.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * UserEvent — Persistent behavioral and transactional event record.
 *
 * Provides research-grade tracking of user interactions across the platform.
 * Supports both authenticated users and anonymous guest operations.
 */
@Entity
@Table(name = "user_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private EventType eventType;

    @Column(name = "event_timestamp", nullable = false)
    @Builder.Default
    private Instant eventTimestamp = Instant.now();

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
