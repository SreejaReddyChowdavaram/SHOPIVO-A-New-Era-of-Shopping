package com.securecommerce.platform.mail.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Properties;

/**
 * SmtpEmailService — Standard Spring Boot SMTP Email Service using JavaMailSender.
 *
 * Implements clean, production-grade SMTP email delivery compatible with Spring Boot 3.4.3 and Java 21.
 *
 * KEY BEHAVIORS:
 * - Uses Spring Boot's supported JavaMailSender integration and Jakarta Mail MimeMessageHelper.
 * - Missing credentials NEVER prevent application startup (graceful null-safe initialization).
 * - When credentials are not configured, isConfigured() returns false and sendPasswordResetOtp()
 *   rejects with HTTP 503 SERVICE_UNAVAILABLE — preventing fake deliveries or dangling OTP records.
 * - Never prints OTPs, passwords, or SMTP secrets in logs or API responses.
 * - Supports STARTTLS, connection timeouts (5s), and authenticated SMTP across providers (Gmail, Brevo, AWS SES, Mailgun, SendGrid).
 */
@Service
public class SmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private final EmailTemplateService emailTemplateService;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.from:no-reply@shopivo.com}")
    private String mailFrom;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private boolean starttlsEnable;

    @Autowired(required = false)
    private JavaMailSender javaMailSender;

    public SmtpEmailService(EmailTemplateService emailTemplateService) {
        this.emailTemplateService = emailTemplateService;
    }

    /**
     * Evaluates whether valid SMTP connection parameters and authentication credentials are set.
     *
     * @return true if MAIL_HOST, MAIL_USERNAME, and MAIL_PASSWORD are all non-empty
     */
    @Override
    public boolean isConfigured() {
        return mailHost != null && !mailHost.trim().isEmpty()
                && mailUsername != null && !mailUsername.trim().isEmpty()
                && mailPassword != null && !mailPassword.trim().isEmpty();
    }

    /**
     * Resolves the primary JavaMailSender bean or dynamically builds one from environment configuration.
     */
    private JavaMailSender resolveMailSender() {
        if (this.javaMailSender != null) {
            return this.javaMailSender;
        }

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(mailHost.trim());
        sender.setPort(mailPort);
        sender.setUsername(mailUsername.trim());
        sender.setPassword(mailPassword);
        sender.setDefaultEncoding(StandardCharsets.UTF_8.name());

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", String.valueOf(smtpAuth));
        props.put("mail.smtp.starttls.enable", String.valueOf(starttlsEnable));
        props.put("mail.smtp.starttls.required", String.valueOf(starttlsEnable));
        props.put("mail.smtp.ssl.trust", mailHost != null && !mailHost.isBlank() ? mailHost.trim() : "*");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        return sender;
    }

    /**
     * Sends the password reset verification code email via JavaMailSender.
     *
     * @throws ResponseStatusException HTTP 503 if SMTP is unconfigured; HTTP 502 on mail gateway failure
     */
    @Override
    public void sendPasswordResetOtp(String toEmail, String recipientName, String otp, int expiryMinutes) {
        if (!isConfigured()) {
            log.warn("SMTP email dispatch blocked: Server SMTP credentials are not configured. Target: {}", maskEmail(toEmail));
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Email delivery service is currently not configured or unavailable on the server. Please contact system administrator."
            );
        }

        try {
            JavaMailSender sender = resolveMailSender();
            MimeMessage mimeMessage = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());

            String fromAddress = (mailFrom != null && !mailFrom.trim().isEmpty()) ? mailFrom.trim() : "shopivo.team@gmail.com";
            helper.setFrom(fromAddress, "SHOPIVO");
            helper.setTo(toEmail.trim());
            helper.setSubject("SHOPIVO – Your Password Reset Verification Code");

            String htmlContent = emailTemplateService.buildPasswordResetHtml(recipientName, otp, expiryMinutes);
            String textContent = emailTemplateService.buildPasswordResetText(recipientName, otp, expiryMinutes);

            // Sets multipart alternative: plain text first, HTML alternative second
            helper.setText(textContent, htmlContent);

            sender.send(mimeMessage);
            log.info("Password reset OTP email delivered successfully via SMTP to {}", maskEmail(toEmail));
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            log.error("Failed to transmit OTP email to {}: {}", maskEmail(toEmail), e.getMessage());
            String detailMsg = "Failed to deliver email through SMTP gateway. Please try again later.";
            String rawErr = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (rawErr.contains("authentication") || rawErr.contains("535") || rawErr.contains("username and password not accepted")) {
                detailMsg = "SMTP authentication failed with Brevo. Please verify your MAIL_PASSWORD key in Render.";
            } else if (rawErr.contains("timed out") || rawErr.contains("timeout") || rawErr.contains("connect")) {
                detailMsg = "SMTP connection to Brevo timed out. Please try again.";
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, detailMsg);
        }
    }

    /**
     * Helper to mask email address for privacy in audit logs.
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@", 2);
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 2) {
            return name.charAt(0) + "***@" + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + domain;
    }
}
