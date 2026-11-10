package com.securecommerce.platform.mail.service;

/**
 * EmailService — Interface for transactional email delivery.
 */
public interface EmailService {

    /**
     * Checks whether valid SMTP configuration is present.
     */
    boolean isConfigured();

    /**
     * Sends the password reset verification code email.
     *
     * @param toEmail       recipient address
     * @param recipientName recipient name
     * @param otp           6-digit verification code
     * @param expiryMinutes code validity window
     */
    void sendPasswordResetOtp(String toEmail, String recipientName, String otp, int expiryMinutes);
}

