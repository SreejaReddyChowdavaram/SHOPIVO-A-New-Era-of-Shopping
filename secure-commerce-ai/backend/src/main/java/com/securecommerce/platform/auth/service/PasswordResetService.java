package com.securecommerce.platform.auth.service;

import com.securecommerce.platform.auth.dto.ForgotPasswordRequestOtpRequest;
import com.securecommerce.platform.auth.dto.ResetPasswordRequest;
import com.securecommerce.platform.auth.dto.VerifyOtpRequest;
import com.securecommerce.platform.auth.entity.PasswordResetOtp;
import com.securecommerce.platform.auth.repository.PasswordResetOtpRepository;
import com.securecommerce.platform.mail.service.EmailService;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * PasswordResetService — Manages secure OTP generation, verification, and password updates.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.mail.otp-expiry-minutes:10}")
    private int otpExpiryMinutes = 10;

    @Value("${app.mail.resend-cooldown-seconds:60}")
    private int resendCooldownSeconds = 60;

    @Value("${app.mail.max-attempts:5}")
    private int maxAttempts = 5;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Request a 6-digit OTP code sent to the registered email address.
     * Uses generic response messaging to prevent account enumeration.
     */
    @Transactional
    public Map<String, Object> requestOtp(ForgotPasswordRequestOtpRequest request) {
        String email = request.getEmail() != null ? request.getEmail().toLowerCase().trim() : "";
        User.Role portalRole = request.getPortalRole();

        // 1. Verify email delivery service readiness upfront
        if (!emailService.isConfigured()) {
            log.warn("Password reset requested for {} ({}) but email delivery service is unconfigured.", email, portalRole);
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Email delivery service is currently not configured or unavailable on the server. Please contact system administrator."
            );
        }

        // 2. Resend cooldown verification
        Optional<PasswordResetOtp> recentOtpOpt = otpRepository
                .findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(email, portalRole);

        if (recentOtpOpt.isPresent()) {
            PasswordResetOtp recentOtp = recentOtpOpt.get();
            if (recentOtp.getLastSentAt() != null) {
                long secondsSinceLastSent = Duration.between(recentOtp.getLastSentAt(), Instant.now()).getSeconds();
                if (secondsSinceLastSent < resendCooldownSeconds) {
                    long remainingWait = resendCooldownSeconds - secondsSinceLastSent;
                    throw new ResponseStatusException(
                            HttpStatus.TOO_MANY_REQUESTS,
                            "Please wait " + remainingWait + " seconds before requesting a new verification code."
                    );
                }
            }
        }

        // 2. Account lookup
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email: {} under portal: {}", email, portalRole);
            return Map.of(
                    "success", true,
                    "message", "If an account is associated with this email for the " + portalRole + " Portal, a 6-digit verification code has been sent.",
                    "maskedEmail", maskEmail(email),
                    "cooldownSeconds", resendCooldownSeconds,
                    "expiresInMinutes", otpExpiryMinutes
            );
        }

        User user = userOpt.get();

        // 3. Strict Portal Role Verification
        if (user.getRole() != portalRole) {
            log.warn("Password reset role mismatch: user {} is registered as {}, but attempted reset via {} Portal",
                    email, user.getRole(), portalRole);
            // Return generic message to avoid leaking role information to unauthenticated users
            return Map.of(
                    "success", true,
                    "message", "If an account is associated with this email for the " + portalRole + " Portal, a 6-digit verification code has been sent.",
                    "maskedEmail", maskEmail(email),
                    "cooldownSeconds", resendCooldownSeconds,
                    "expiresInMinutes", otpExpiryMinutes
            );
        }

        // 4. Invalidate any existing active OTPs for this user
        otpRepository.invalidatePreviousOtps(user.getId(), "PASSWORD_RESET", Instant.now());

        // 5. Generate cryptographically secure 6-digit OTP
        int code = 100000 + secureRandom.nextInt(900000);
        String plainOtp = String.valueOf(code);

        // 6. Save hashed OTP record
        PasswordResetOtp otpRecord = PasswordResetOtp.builder()
                .userId(user.getId())
                .email(email)
                .portalRole(portalRole)
                .otpHash(passwordEncoder.encode(plainOtp))
                .purpose("PASSWORD_RESET")
                .expiresAt(Instant.now().plus(Duration.ofMinutes(otpExpiryMinutes)))
                .attempts(0)
                .maxAttempts(maxAttempts)
                .lastSentAt(Instant.now())
                .build();

        otpRepository.save(otpRecord);

        // 7. Dispatch OTP via Email Service
        emailService.sendPasswordResetOtp(user.getEmail(), user.getFirstName(), plainOtp, otpExpiryMinutes);

        return Map.of(
                "success", true,
                "message", "A 6-digit verification code has been sent to your email address.",
                "maskedEmail", maskEmail(email),
                "cooldownSeconds", resendCooldownSeconds,
                "expiresInMinutes", otpExpiryMinutes
        );
    }

    /**
     * Verify the 6-digit OTP code.
     * On success, issues a single-use reset token for Step 3.
     */
    @Transactional
    public Map<String, Object> verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail() != null ? request.getEmail().toLowerCase().trim() : "";
        User.Role portalRole = request.getPortalRole();
        String enteredOtp = request.getOtp() != null ? request.getOtp().trim() : "";

        // 1. Locate unconsumed OTP record
        PasswordResetOtp otpRecord = otpRepository
                .findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(email, portalRole)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid or expired verification code. Please request a new code."
                ));

        // 2. Check expiration
        if (otpRecord.isExpired()) {
            otpRecord.setConsumedAt(Instant.now());
            otpRepository.save(otpRecord);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Verification code has expired. Please request a new code."
            );
        }

        // 3. Check attempt limit
        if (otpRecord.isExceededAttempts()) {
            otpRecord.setConsumedAt(Instant.now());
            otpRepository.save(otpRecord);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Too many incorrect attempts. This code has been invalidated for security. Please request a new code."
            );
        }

        // 4. Verify OTP hash match
        boolean matches = passwordEncoder.matches(enteredOtp, otpRecord.getOtpHash());

        if (!matches) {
            int newAttempts = otpRecord.getAttempts() + 1;
            otpRecord.setAttempts(newAttempts);

            if (newAttempts >= otpRecord.getMaxAttempts()) {
                otpRecord.setConsumedAt(Instant.now());
                otpRepository.save(otpRecord);
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Maximum verification attempts exceeded. Code has been invalidated. Please request a new code."
                );
            }

            otpRepository.save(otpRecord);
            int remaining = otpRecord.getMaxAttempts() - newAttempts;
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid verification code. " + remaining + " attempt(s) remaining."
            );
        }

        // 5. Successful verification: generate single-use reset token
        String resetToken = UUID.randomUUID().toString();
        otpRecord.setResetToken(resetToken);
        otpRepository.save(otpRecord);

        return Map.of(
                "verified", true,
                "resetToken", resetToken,
                "message", "Verification code confirmed successfully."
        );
    }

    /**
     * Reset password after OTP verification.
     */
    @Transactional
    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail() != null ? request.getEmail().toLowerCase().trim() : "";
        User.Role portalRole = request.getPortalRole();

        // 1. Validate password confirmation
        if (request.getNewPassword() == null || !request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password and confirmation do not match.");
        }

        // 2. Locate OTP record via resetToken or entered OTP
        PasswordResetOtp otpRecord = null;

        if (request.getResetToken() != null && !request.getResetToken().isBlank()) {
            otpRecord = otpRepository.findByResetTokenAndConsumedAtIsNull(request.getResetToken().trim())
                    .orElse(null);
        }

        if (otpRecord == null && request.getOtp() != null && !request.getOtp().isBlank()) {
            Optional<PasswordResetOtp> opt = otpRepository
                    .findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(email, portalRole);
            if (opt.isPresent() && passwordEncoder.matches(request.getOtp().trim(), opt.get().getOtpHash())) {
                otpRecord = opt.get();
            }
        }

        if (otpRecord == null || otpRecord.isConsumed()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid or expired password reset session. Please request a new verification code."
            );
        }

        if (otpRecord.isExpired()) {
            otpRecord.setConsumedAt(Instant.now());
            otpRepository.save(otpRecord);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password reset session has expired. Please request a new verification code."
            );
        }

        // 3. User verification and strict role validation
        User user = userRepository.findById(otpRecord.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found."));

        if (user.getRole() != portalRole) {
            log.error("Security alert: Attempted cross-role password reset: user {} is {}, reset requested for {}",
                    user.getEmail(), user.getRole(), portalRole);
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This account is registered as " + user.getRole() + ". Password cannot be reset through the " + portalRole + " Portal."
            );
        }

        // 4. Update password (preserves seller approval status, user role, and user active status)
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        if (user.getAuthProvider() == User.AuthProvider.GOOGLE) {
            user.setAuthProvider(User.AuthProvider.LINKED);
            log.info("Account upgraded to LINKED after OTP password setup: {}", user.getEmail());
        }
        userRepository.save(user);

        // 5. Invalidate all OTPs for this user to ensure single-use
        otpRecord.setConsumedAt(Instant.now());
        otpRepository.save(otpRecord);
        otpRepository.invalidatePreviousOtps(user.getId(), "PASSWORD_RESET", Instant.now());

        log.info("Password reset successfully completed for {} (Role: {})", user.getEmail(), user.getRole());

        return Map.of(
                "success", true,
                "message", "Your password has been updated successfully. Please sign in with your new password."
        );
    }

    /**
     * Masks an email address for safe display in UI: "c***r@example.com".
     */
    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        int atIndex = email.indexOf('@');
        String namePart = email.substring(0, atIndex);
        String domainPart = email.substring(atIndex);

        if (namePart.length() <= 2) {
            return namePart.charAt(0) + "***" + domainPart;
        }
        return namePart.charAt(0) + "***" + namePart.charAt(namePart.length() - 1) + domainPart;
    }
}

