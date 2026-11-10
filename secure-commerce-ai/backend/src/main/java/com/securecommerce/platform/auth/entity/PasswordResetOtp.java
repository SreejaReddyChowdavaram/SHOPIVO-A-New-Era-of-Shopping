package com.securecommerce.platform.auth.entity;

import com.securecommerce.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * PasswordResetOtp — Entity for tracking OTP verification codes and password reset requests.
 */
@Entity
@Table(name = "password_reset_otps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "portal_role", nullable = false, length = 50)
    private User.Role portalRole;

    @Column(name = "otp_hash", nullable = false, length = 255)
    private String otpHash;

    @Column(name = "reset_token", length = 255)
    private String resetToken;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String purpose = "PASSWORD_RESET";

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(name = "max_attempts", nullable = false)
    @Builder.Default
    private int maxAttempts = 5;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_sent_at", nullable = false)
    @Builder.Default
    private Instant lastSentAt = Instant.now();

    /**
     * Checks if this OTP has already been consumed / used.
     */
    public boolean isConsumed() {
        return consumedAt != null;
    }

    /**
     * Checks if this OTP has expired based on current timestamp.
     */
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    /**
     * Checks if verification attempts have exceeded the limit.
     */
    public boolean isExceededAttempts() {
        return attempts >= maxAttempts;
    }
}

