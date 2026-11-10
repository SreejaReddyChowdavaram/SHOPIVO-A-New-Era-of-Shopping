package com.securecommerce.platform.mail.service;

import org.springframework.stereotype.Service;

/**
 * EmailTemplateService — Centralized, reusable template engine for transactional emails.
 *
 * Implements SHOPIVO's clean corporate e-commerce design:
 * - Brand identity: Black & Emerald Green (#04DB7E)
 * - Tagline: "A New Era of Shopping"
 * - Clean white card design with professional typography
 * - High-contrast, highlighted OTP code box
 * - Clear 10-minute expiry and security advisories
 * - Cross-client responsive layout (Gmail, Outlook, Apple Mail)
 */
@Service
public class EmailTemplateService {

    /**
     * Generates a corporate e-commerce responsive HTML email for password recovery OTP.
     *
     * @param recipientName recipient full or first name
     * @param otp           6-digit verification code
     * @param expiryMinutes validity period in minutes
     * @return email-client compatible HTML string
     */
    public String buildPasswordResetHtml(String recipientName, String otp, int expiryMinutes) {
        String safeName = (recipientName != null && !recipientName.isBlank()) 
                ? escapeHtml(recipientName.trim()) 
                : "Dear User";
        String safeOtp = (otp != null) ? escapeHtml(otp.trim()) : "";

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <title>SHOPIVO – Your Password Reset Verification Code</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  background-color: #F4F6F8;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  color: #2D3748;
                  -webkit-font-smoothing: antialiased;
                }
                table {
                  border-collapse: separate;
                }
                td {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                }
                .email-wrapper {
                  width: 100%%;
                  background-color: #F4F6F8;
                  padding: 40px 16px;
                }
                .email-container {
                  max-width: 580px;
                  margin: 0 auto;
                  background-color: #FFFFFF;
                  border: 1px solid #E2E8F0;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                  overflow: hidden;
                }
                .email-header {
                  background-color: #050505;
                  padding: 28px 36px;
                  text-align: center;
                  border-bottom: 3px solid #04DB7E;
                }
                .brand-title {
                  font-size: 26px;
                  font-weight: 900;
                  color: #FFFFFF;
                  letter-spacing: 2px;
                  margin: 0;
                  text-transform: uppercase;
                }
                .brand-accent {
                  color: #04DB7E;
                }
                .brand-tagline {
                  font-size: 12px;
                  color: #A0AEC0;
                  letter-spacing: 1px;
                  margin: 6px 0 0 0;
                  text-transform: uppercase;
                  font-weight: 500;
                }
                .email-body {
                  padding: 40px 36px 32px 36px;
                }
                .greeting {
                  font-size: 16px;
                  font-weight: 600;
                  color: #1A202C;
                  margin: 0 0 16px 0;
                }
                .content-text {
                  font-size: 15px;
                  line-height: 1.6;
                  color: #4A5568;
                  margin: 0 0 20px 0;
                }
                .otp-card {
                  background: #F7FAFC;
                  border: 2px dashed #04DB7E;
                  border-radius: 10px;
                  padding: 24px 20px;
                  text-align: center;
                  margin: 28px 0;
                }
                .otp-title {
                  font-size: 12px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 1.5px;
                  color: #718096;
                  margin: 0 0 10px 0;
                }
                .otp-number {
                  font-size: 38px;
                  font-weight: 800;
                  letter-spacing: 8px;
                  color: #050505;
                  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Monaco, Courier, monospace;
                  margin: 0;
                  line-height: 1.2;
                }
                .otp-expiry {
                  font-size: 13px;
                  color: #047857;
                  font-weight: 600;
                  margin: 12px 0 0 0;
                }
                .security-card {
                  background-color: #FFF5F5;
                  border-left: 4px solid #E53E3E;
                  border-radius: 4px;
                  padding: 16px 20px;
                  margin: 28px 0 24px 0;
                }
                .security-title {
                  font-size: 12px;
                  font-weight: 800;
                  text-transform: uppercase;
                  letter-spacing: 0.8px;
                  color: #C53030;
                  margin: 0 0 8px 0;
                }
                .security-list {
                  margin: 0;
                  padding-left: 18px;
                  font-size: 13px;
                  line-height: 1.6;
                  color: #742A2A;
                }
                .support-text {
                  font-size: 14px;
                  line-height: 1.6;
                  color: #4A5568;
                  margin: 24px 0 0 0;
                }
                .support-link {
                  color: #04DB7E;
                  font-weight: 600;
                  text-decoration: none;
                }
                .closing-section {
                  margin-top: 28px;
                  padding-top: 20px;
                  border-top: 1px solid #EDF2F7;
                  font-size: 14px;
                  line-height: 1.6;
                  color: #2D3748;
                }
                .email-footer {
                  background-color: #F7FAFC;
                  padding: 24px 36px;
                  border-top: 1px solid #E2E8F0;
                  text-align: center;
                  font-size: 12px;
                  color: #718096;
                  line-height: 1.6;
                }
              </style>
            </head>
            <body>
              <table role="presentation" class="email-wrapper" width="100%%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <table role="presentation" class="email-container" width="100%%" cellspacing="0" cellpadding="0" border="0">
                      <!-- Brand Header -->
                      <tr>
                        <td class="email-header">
                          <h1 class="brand-title">SHOPIVO<span class="brand-accent">.</span></h1>
                          <p class="brand-tagline">A New Era of Shopping</p>
                        </td>
                      </tr>
                      <!-- Main Body Card -->
                      <tr>
                        <td class="email-body">
                          <p class="greeting">Hello %s,</p>
                          <p class="content-text">
                            We received a request to reset the password associated with your SHOPIVO account.
                          </p>
                          <p class="content-text">
                            Your One-Time Password (OTP) is:
                          </p>

                          <!-- Highlighted OTP Box -->
                          <div class="otp-card">
                            <div class="otp-title">One-Time Password (OTP)</div>
                            <div class="otp-number">%s</div>
                            <div class="otp-expiry">This verification code is valid for %d minutes.</div>
                          </div>

                          <!-- Security Notice Section -->
                          <div class="security-card">
                            <div class="security-title">SECURITY NOTICE</div>
                            <ul class="security-list">
                              <li>Never share this OTP with anyone.</li>
                              <li>SHOPIVO will never ask you to disclose your OTP over phone or message.</li>
                              <li>If you did not request a password reset, please ignore this email. Your account will remain secure.</li>
                            </ul>
                          </div>

                          <!-- Support & Assistance -->
                          <p class="support-text">
                            Need help? Contact our support team at <a href="mailto:shopivo.team@gmail.com" class="support-link">shopivo.team@gmail.com</a>.
                          </p>

                          <!-- Professional Sign-off -->
                          <div class="closing-section">
                            <p style="margin: 0 0 4px 0;">Thank you for choosing SHOPIVO!</p>
                            <p style="margin: 0; font-weight: 700; color: #1A202C;">Happy Shopping,<br><span style="color: #04DB7E;">Team SHOPIVO</span></p>
                          </div>
                        </td>
                      </tr>
                      <!-- Footer -->
                      <tr>
                        <td class="email-footer">
                          &copy; 2026 SHOPIVO Inc. Enterprise E-Commerce Platform.<br>
                          This is an automated transactional security message. Please do not reply directly to this email.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(safeName, safeOtp, expiryMinutes);
    }

    /**
     * Generates a clean plain-text fallback version for mail clients that do not render HTML.
     *
     * @param recipientName recipient full or first name
     * @param otp           6-digit verification code
     * @param expiryMinutes validity period in minutes
     * @return plain-text formatted string
     */
    public String buildPasswordResetText(String recipientName, String otp, int expiryMinutes) {
        String safeName = (recipientName != null && !recipientName.isBlank()) 
                ? recipientName.trim() 
                : "Dear User";

        return """
            =======================================================
            SHOPIVO — A New Era of Shopping
            =======================================================

            Hello %s,

            We received a request to reset the password associated with your SHOPIVO account.

            Your One-Time Password (OTP) is:

                %s

            This verification code is valid for %d minutes.

            -------------------------------------------------------
            SECURITY NOTICE:
            -------------------------------------------------------
            - Never share this OTP with anyone.
            - SHOPIVO will never ask you to disclose your OTP over phone or message.
            - If you did not request a password reset, please ignore this email. Your account will remain secure.

            Need help? Contact our support team at shopivo.team@gmail.com.

            Thank you for choosing SHOPIVO!

            Happy Shopping,
            Team SHOPIVO

            =======================================================
            (c) 2026 SHOPIVO Inc. Enterprise E-Commerce Platform.
            """.formatted(safeName, otp, expiryMinutes);
    }

    /**
     * Sanitizes strings for safe HTML rendering to prevent injection attacks.
     */
    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#x27;");
    }
}
