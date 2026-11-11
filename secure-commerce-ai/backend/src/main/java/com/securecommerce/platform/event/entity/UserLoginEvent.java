package com.securecommerce.platform.event.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * UserLoginEvent — Dedicated entity for authentication activity and telemetry.
 *
 * Implements security and audit trail for CUSTOMER, SELLER, and ADMIN logins.
 * Captures both successful logins and failed attempts separately.
 * Absolutely NO passwords, OTPs, JWTs, or secrets are recorded.
 */
@Entity
@Table(name = "user_login_events", indexes = {
        @Index(name = "idx_login_events_user_id", columnList = "user_id"),
        @Index(name = "idx_login_events_email", columnList = "user_email"),
        @Index(name = "idx_login_events_result_timestamp", columnList = "login_result, login_timestamp DESC"),
        @Index(name = "idx_login_events_ip", columnList = "ip_address")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLoginEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_email", nullable = false, length = 255)
    private String userEmail;

    @Column(name = "user_role", length = 50)
    private String userRole;

    @Column(name = "auth_method", nullable = false, length = 50)
    private String authMethod;

    @CreationTimestamp
    @Column(name = "login_timestamp", nullable = false)
    private Instant loginTimestamp;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "ip_version", nullable = false, length = 10)
    private String ipVersion;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "state_region", length = 100)
    private String stateRegion;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "location_status", nullable = false, length = 50)
    @Builder.Default
    private String locationStatus = "UNAVAILABLE";

    @Column(name = "browser", length = 100)
    private String browser;

    @Column(name = "operating_system", length = 100)
    private String operatingSystem;

    @Column(name = "device_type", length = 50)
    private String deviceType;

    @Column(name = "login_result", nullable = false, length = 20)
    private String loginResult;

    @Column(name = "failure_reason", length = 100)
    private String failureReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}

