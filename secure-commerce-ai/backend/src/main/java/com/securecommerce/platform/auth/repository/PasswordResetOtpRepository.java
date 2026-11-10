package com.securecommerce.platform.auth.repository;

import com.securecommerce.platform.auth.entity.PasswordResetOtp;
import com.securecommerce.platform.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    /**
     * Find latest active (unconsumed) OTP record for a given email and portal role.
     */
    Optional<PasswordResetOtp> findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(
            String email,
            User.Role portalRole
    );

    /**
     * Find latest active OTP by verified reset token.
     */
    Optional<PasswordResetOtp> findByResetTokenAndConsumedAtIsNull(String resetToken);

    /**
     * Invalidate any previous unconsumed OTPs for a user and purpose.
     */
    @Modifying
    @Query("UPDATE PasswordResetOtp p SET p.consumedAt = :now WHERE p.userId = :userId AND p.purpose = :purpose AND p.consumedAt IS NULL")
    void invalidatePreviousOtps(
            @Param("userId") Long userId,
            @Param("purpose") String purpose,
            @Param("now") Instant now
    );
}

