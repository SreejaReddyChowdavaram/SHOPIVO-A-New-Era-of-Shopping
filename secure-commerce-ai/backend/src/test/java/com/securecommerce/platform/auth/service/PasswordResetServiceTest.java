package com.securecommerce.platform.auth.service;

import com.securecommerce.platform.auth.dto.ForgotPasswordRequestOtpRequest;
import com.securecommerce.platform.auth.dto.ResetPasswordRequest;
import com.securecommerce.platform.auth.dto.VerifyOtpRequest;
import com.securecommerce.platform.auth.entity.PasswordResetOtp;
import com.securecommerce.platform.auth.repository.PasswordResetOtpRepository;
import com.securecommerce.platform.mail.service.EmailService;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetOtpRepository otpRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User customerUser;
    private User sellerUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(passwordResetService, "otpExpiryMinutes", 10);
        ReflectionTestUtils.setField(passwordResetService, "resendCooldownSeconds", 60);
        ReflectionTestUtils.setField(passwordResetService, "maxAttempts", 5);

        lenient().when(emailService.isConfigured()).thenReturn(true);

        customerUser = User.builder()
                .id(101L)
                .email("customer@shopivo.test")
                .firstName("Alice")
                .lastName("Customer")
                .role(User.Role.CUSTOMER)
                .passwordHash("old_hashed_pass")
                .enabled(true)
                .build();

        sellerUser = User.builder()
                .id(202L)
                .email("seller@shopivo.test")
                .firstName("Bob")
                .lastName("Merchant")
                .role(User.Role.SELLER)
                .passwordHash("old_hashed_seller_pass")
                .enabled(false) // Pending verification / suspended
                .build();

        adminUser = User.builder()
                .id(303L)
                .email("admin@shopivo.test")
                .firstName("Root")
                .lastName("Admin")
                .role(User.Role.ADMIN)
                .passwordHash("old_hashed_admin_pass")
                .enabled(true)
                .build();
    }

    @Test
    @DisplayName("Request OTP generates 6-digit code, hashes it, saves record and dispatches email")
    void testRequestOtp_Success() {
        ForgotPasswordRequestOtpRequest request = ForgotPasswordRequestOtpRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .build();

        when(otpRepository.findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(
                "customer@shopivo.test", User.Role.CUSTOMER)).thenReturn(Optional.empty());
        when(userRepository.findByEmail("customer@shopivo.test")).thenReturn(Optional.of(customerUser));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_otp_value");

        Map<String, Object> response = passwordResetService.requestOtp(request);

        assertThat(response.get("success")).isEqualTo(true);
        assertThat((String) response.get("maskedEmail")).isEqualTo("customer@shopivo.test");
        assertThat((String) response.get("email")).isEqualTo("customer@shopivo.test");

        verify(otpRepository).invalidatePreviousOtps(eq(101L), eq("PASSWORD_RESET"), any(Instant.class));

        ArgumentCaptor<PasswordResetOtp> captor = ArgumentCaptor.forClass(PasswordResetOtp.class);
        verify(otpRepository).save(captor.capture());
        PasswordResetOtp savedOtp = captor.getValue();

        assertThat(savedOtp.getUserId()).isEqualTo(101L);
        assertThat(savedOtp.getEmail()).isEqualTo("customer@shopivo.test");
        assertThat(savedOtp.getPortalRole()).isEqualTo(User.Role.CUSTOMER);
        assertThat(savedOtp.getOtpHash()).isEqualTo("hashed_otp_value");
        assertThat(savedOtp.getAttempts()).isEqualTo(0);

        verify(emailService).sendPasswordResetOtp(eq("customer@shopivo.test"), eq("Alice"), anyString(), eq(10));
    }

    @Test
    @DisplayName("Request OTP enforces 60-second resend cooldown")
    void testRequestOtp_CooldownEnforced() {
        ForgotPasswordRequestOtpRequest request = ForgotPasswordRequestOtpRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .build();

        PasswordResetOtp recentOtp = PasswordResetOtp.builder()
                .lastSentAt(Instant.now().minusSeconds(25))
                .build();

        when(otpRepository.findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(
                "customer@shopivo.test", User.Role.CUSTOMER)).thenReturn(Optional.of(recentOtp));

        assertThatThrownBy(() -> passwordResetService.requestOtp(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                    assertThat(rse.getReason()).contains("Please wait");
                });

        verify(emailService, never()).sendPasswordResetOtp(anyString(), anyString(), anyString(), anyInt());
    }

    @Test
    @DisplayName("Request OTP throws NOT_FOUND when email does not exist")
    void testRequestOtp_UserNotFound_ThrowsNotFound() {
        ForgotPasswordRequestOtpRequest request = ForgotPasswordRequestOtpRequest.builder()
                .email("unknown@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .build();

        when(otpRepository.findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(
                "unknown@shopivo.test", User.Role.CUSTOMER)).thenReturn(Optional.empty());
        when(userRepository.findByEmail("unknown@shopivo.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.requestOtp(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(rse.getReason()).contains("No account found");
                });

        verify(emailService, never()).sendPasswordResetOtp(anyString(), anyString(), anyString(), anyInt());
        verify(otpRepository, never()).save(any());
    }

    @Test
    @DisplayName("Request OTP throws BAD_REQUEST on role mismatch (Customer trying Admin portal)")
    void testRequestOtp_RoleMismatch_ThrowsBadRequest() {
        ForgotPasswordRequestOtpRequest request = ForgotPasswordRequestOtpRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.ADMIN)
                .build();

        when(otpRepository.findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(
                "customer@shopivo.test", User.Role.ADMIN)).thenReturn(Optional.empty());
        when(userRepository.findByEmail("customer@shopivo.test")).thenReturn(Optional.of(customerUser));

        assertThatThrownBy(() -> passwordResetService.requestOtp(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("registered under the CUSTOMER Portal");
                });

        verify(emailService, never()).sendPasswordResetOtp(anyString(), anyString(), anyString(), anyInt());
        verify(otpRepository, never()).save(any());
    }

    @Test
    @DisplayName("Request OTP throws FORBIDDEN when account is disabled")
    void testRequestOtp_DisabledUser_ThrowsForbidden() {
        ForgotPasswordRequestOtpRequest request = ForgotPasswordRequestOtpRequest.builder()
                .email("seller@shopivo.test")
                .portalRole(User.Role.SELLER)
                .build();

        when(otpRepository.findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(
                "seller@shopivo.test", User.Role.SELLER)).thenReturn(Optional.empty());
        when(userRepository.findByEmail("seller@shopivo.test")).thenReturn(Optional.of(sellerUser));

        assertThatThrownBy(() -> passwordResetService.requestOtp(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("disabled");
                });

        verify(emailService, never()).sendPasswordResetOtp(anyString(), anyString(), anyString(), anyInt());
        verify(otpRepository, never()).save(any());
    }

    @Test
    @DisplayName("Verify OTP returns reset token on correct OTP")
    void testVerifyOtp_Success() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .otp("123456")
                .build();

        PasswordResetOtp record = PasswordResetOtp.builder()
                .id(1L)
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .otpHash("hashed_123456")
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .attempts(0)
                .maxAttempts(5)
                .build();

        when(otpRepository.findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(
                "customer@shopivo.test", User.Role.CUSTOMER)).thenReturn(Optional.of(record));
        when(passwordEncoder.matches("123456", "hashed_123456")).thenReturn(true);

        Map<String, Object> response = passwordResetService.verifyOtp(request);

        assertThat(response.get("verified")).isEqualTo(true);
        assertThat(response.get("resetToken")).isNotNull();
        assertThat(record.getResetToken()).isEqualTo(response.get("resetToken"));
        verify(otpRepository).save(record);
    }

    @Test
    @DisplayName("Verify OTP increments attempts on incorrect OTP and reports remaining count")
    void testVerifyOtp_IncorrectOtp() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .otp("999999")
                .build();

        PasswordResetOtp record = PasswordResetOtp.builder()
                .id(1L)
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .otpHash("hashed_123456")
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .attempts(1)
                .maxAttempts(5)
                .build();

        when(otpRepository.findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(
                "customer@shopivo.test", User.Role.CUSTOMER)).thenReturn(Optional.of(record));
        when(passwordEncoder.matches("999999", "hashed_123456")).thenReturn(false);

        assertThatThrownBy(() -> passwordResetService.verifyOtp(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("3 attempt(s) remaining");
                });

        assertThat(record.getAttempts()).isEqualTo(2);
        verify(otpRepository).save(record);
    }

    @Test
    @DisplayName("Verify OTP invalidates code when 5 attempts are reached")
    void testVerifyOtp_ExceededAttempts_LocksOut() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .otp("999999")
                .build();

        PasswordResetOtp record = PasswordResetOtp.builder()
                .id(1L)
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .otpHash("hashed_123456")
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .attempts(4)
                .maxAttempts(5)
                .build();

        when(otpRepository.findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(
                "customer@shopivo.test", User.Role.CUSTOMER)).thenReturn(Optional.of(record));
        when(passwordEncoder.matches("999999", "hashed_123456")).thenReturn(false);

        assertThatThrownBy(() -> passwordResetService.verifyOtp(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Maximum verification attempts exceeded");
                });

        assertThat(record.getAttempts()).isEqualTo(5);
        assertThat(record.getConsumedAt()).isNotNull();
        verify(otpRepository).save(record);
    }

    @Test
    @DisplayName("Verify OTP rejects expired code")
    void testVerifyOtp_Expired() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .otp("123456")
                .build();

        PasswordResetOtp record = PasswordResetOtp.builder()
                .id(1L)
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .otpHash("hashed_123456")
                .expiresAt(Instant.now().minusSeconds(10)) // Expired
                .attempts(0)
                .maxAttempts(5)
                .build();

        when(otpRepository.findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(
                "customer@shopivo.test", User.Role.CUSTOMER)).thenReturn(Optional.of(record));

        assertThatThrownBy(() -> passwordResetService.verifyOtp(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("expired");
                });
    }

    @Test
    @DisplayName("Reset Password updates customer password and consumes OTP")
    void testResetPassword_Customer_Success() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .resetToken("valid-token-uuid")
                .newPassword("NewCustomerPass2026!")
                .confirmPassword("NewCustomerPass2026!")
                .build();

        PasswordResetOtp record = PasswordResetOtp.builder()
                .id(1L)
                .userId(101L)
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .resetToken("valid-token-uuid")
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .build();

        when(otpRepository.findByResetTokenAndConsumedAtIsNull("valid-token-uuid")).thenReturn(Optional.of(record));
        when(userRepository.findById(101L)).thenReturn(Optional.of(customerUser));
        when(passwordEncoder.encode("NewCustomerPass2026!")).thenReturn("new_bcrypt_hash");

        Map<String, Object> response = passwordResetService.resetPassword(request);

        assertThat(response.get("success")).isEqualTo(true);
        assertThat(customerUser.getPasswordHash()).isEqualTo("new_bcrypt_hash");
        assertThat(record.getConsumedAt()).isNotNull();

        verify(userRepository).save(customerUser);
        verify(otpRepository).save(record);
        verify(otpRepository).invalidatePreviousOtps(eq(101L), eq("PASSWORD_RESET"), any(Instant.class));
    }

    @Test
    @DisplayName("Reset Password for Seller PRESERVES enabled/approval status unchanged")
    void testResetPassword_Seller_PreservesApprovalStatus() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("seller@shopivo.test")
                .portalRole(User.Role.SELLER)
                .resetToken("seller-token-uuid")
                .newPassword("NewSellerPass2026!")
                .confirmPassword("NewSellerPass2026!")
                .build();

        PasswordResetOtp record = PasswordResetOtp.builder()
                .id(2L)
                .userId(202L)
                .email("seller@shopivo.test")
                .portalRole(User.Role.SELLER)
                .resetToken("seller-token-uuid")
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .build();

        when(otpRepository.findByResetTokenAndConsumedAtIsNull("seller-token-uuid")).thenReturn(Optional.of(record));
        when(userRepository.findById(202L)).thenReturn(Optional.of(sellerUser));
        when(passwordEncoder.encode("NewSellerPass2026!")).thenReturn("new_seller_hash");

        // Note: sellerUser.isEnabled() was false
        assertThat(sellerUser.isEnabled()).isFalse();

        passwordResetService.resetPassword(request);

        // Crucial safety check: Resetting password must NEVER auto-approve or enable a suspended/pending seller
        assertThat(sellerUser.isEnabled()).isFalse();
        assertThat(sellerUser.getPasswordHash()).isEqualTo("new_seller_hash");
        verify(userRepository).save(sellerUser);
    }

    @Test
    @DisplayName("Reset Password rejects password mismatch")
    void testResetPassword_PasswordMismatch() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .resetToken("valid-token-uuid")
                .newPassword("PasswordOne2026!")
                .confirmPassword("DifferentPassword2026!")
                .build();

        assertThatThrownBy(() -> passwordResetService.resetPassword(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("do not match");
                });

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Reset Password rejects cross-role reset attempt")
    void testResetPassword_CrossRoleConflict() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.SELLER) // Attempting to use customer token on seller portal
                .resetToken("token-uuid")
                .newPassword("NewPass2026!")
                .confirmPassword("NewPass2026!")
                .build();

        PasswordResetOtp record = PasswordResetOtp.builder()
                .id(1L)
                .userId(101L) // Customer user
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .resetToken("token-uuid")
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .build();

        when(otpRepository.findByResetTokenAndConsumedAtIsNull("token-uuid")).thenReturn(Optional.of(record));
        when(userRepository.findById(101L)).thenReturn(Optional.of(customerUser));

        assertThatThrownBy(() -> passwordResetService.resetPassword(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(rse.getReason()).contains("registered as CUSTOMER");
                });
    }

    @Test
    @DisplayName("Reset Password for Admin succeeds for authorized Admin account")
    void testResetPassword_Admin_Success() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("admin@shopivo.test")
                .portalRole(User.Role.ADMIN)
                .resetToken("admin-token-uuid")
                .newPassword("SuperAdmin2026!#")
                .confirmPassword("SuperAdmin2026!#")
                .build();

        PasswordResetOtp record = PasswordResetOtp.builder()
                .id(3L)
                .userId(303L)
                .email("admin@shopivo.test")
                .portalRole(User.Role.ADMIN)
                .resetToken("admin-token-uuid")
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .build();

        when(otpRepository.findByResetTokenAndConsumedAtIsNull("admin-token-uuid")).thenReturn(Optional.of(record));
        when(userRepository.findById(303L)).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.encode("SuperAdmin2026!#")).thenReturn("new_admin_hash");

        Map<String, Object> response = passwordResetService.resetPassword(request);

        assertThat(response.get("success")).isEqualTo(true);
        assertThat(adminUser.getPasswordHash()).isEqualTo("new_admin_hash");
        verify(userRepository).save(adminUser);
    }

    @Test
    @DisplayName("Request OTP when SMTP email service is unconfigured throws HTTP 503 SERVICE_UNAVAILABLE")
    void testRequestOtp_WhenEmailServiceUnconfigured_ThrowsServiceUnavailable() {
        when(emailService.isConfigured()).thenReturn(false);

        ForgotPasswordRequestOtpRequest request = ForgotPasswordRequestOtpRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .build();

        assertThatThrownBy(() -> passwordResetService.requestOtp(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(rse.getReason()).contains("Email delivery service is currently not configured or unavailable");
                });

        verify(otpRepository, never()).save(any());
    }

    @Test
    @DisplayName("Request OTP when email transmission throws exception fails without completing transaction")
    void testRequestOtp_WhenEmailTransmissionFails_ThrowsException() {
        ForgotPasswordRequestOtpRequest request = ForgotPasswordRequestOtpRequest.builder()
                .email("customer@shopivo.test")
                .portalRole(User.Role.CUSTOMER)
                .build();

        when(otpRepository.findTopByEmailIgnoreCaseAndPortalRoleAndConsumedAtIsNullOrderByCreatedAtDesc(
                "customer@shopivo.test", User.Role.CUSTOMER)).thenReturn(Optional.empty());
        when(userRepository.findByEmail("customer@shopivo.test")).thenReturn(Optional.of(customerUser));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_otp_value");

        doThrow(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "SMTP connection failure"))
                .when(emailService).sendPasswordResetOtp(anyString(), anyString(), anyString(), anyInt());

        assertThatThrownBy(() -> passwordResetService.requestOtp(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
                });
    }
}

