package com.securecommerce.platform.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.securecommerce.platform.auth.dto.AuthResponse;
import com.securecommerce.platform.auth.dto.GoogleAuthRequest;
import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.service.EventLoggingService;
import com.securecommerce.platform.security.util.JwtUtil;
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

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoogleAuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private EventLoggingService eventLoggingService;

    @Mock
    private GoogleIdTokenVerifier mockVerifier;

    @InjectMocks
    private GoogleAuthService googleAuthService;

    private static final String TEST_CLIENT_ID = "test-client-id-12345.apps.googleusercontent.com";
    private static final String MOCK_CREDENTIAL = "mock.jwt.credential";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(googleAuthService, "configuredGoogleClientId", TEST_CLIENT_ID);
        ReflectionTestUtils.setField(googleAuthService, "requireSellerApproval", false);
        googleAuthService.setTokenVerifier(mockVerifier);
    }

    private GoogleIdToken createMockIdToken(String email, boolean verified, String sub, String aud) {
        Payload payload = new Payload();
        payload.setEmail(email);
        payload.setEmailVerified(verified);
        payload.setSubject(sub);
        payload.setAudience(aud != null ? aud : TEST_CLIENT_ID);
        payload.set("given_name", "Test");
        payload.set("family_name", "User");
        payload.set("name", "Test User");

        GoogleIdToken mockToken = mock(GoogleIdToken.class);
        when(mockToken.getPayload()).thenReturn(payload);
        return mockToken;
    }

    @Test
    @DisplayName("Admin portalRole is strictly rejected with 403 Forbidden")
    void testAdminPortalRoleRejected() {
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.ADMIN);
        request.setCredential(MOCK_CREDENTIAL);

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("Google authentication cannot be used for Administrator access");
                });

        verifyNoInteractions(mockVerifier);
    }

    @Test
    @DisplayName("Empty or missing credential string is rejected with 400 Bad Request")
    void testEmptyCredentialRejected() {
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.CUSTOMER);
        request.setCredential("   ");

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Missing Google authentication credential");
                });

        verifyNoInteractions(mockVerifier);
    }

    @Test
    @DisplayName("Invalid or expired token returning null is rejected with 401 Unauthorized")
    void testInvalidTokenRejected() throws Exception {
        when(mockVerifier.verify(MOCK_CREDENTIAL)).thenReturn(null);

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.CUSTOMER);
        request.setCredential(MOCK_CREDENTIAL);

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(rse.getReason()).contains("Invalid, expired, or untrusted Google authentication credential");
                });
    }

    @Test
    @DisplayName("Cryptographic signature failure throws 401 Unauthorized")
    void testSignatureFailureHandled() throws Exception {
        when(mockVerifier.verify(anyString())).thenThrow(new GeneralSecurityException("Invalid signature"));

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.CUSTOMER);
        request.setCredential(MOCK_CREDENTIAL);

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(rse.getReason()).contains("Cryptographic token verification failed");
                });
    }

    @Test
    @DisplayName("Network failure reaching Google servers throws 503 Service Unavailable")
    void testNetworkFailureHandled() throws Exception {
        when(mockVerifier.verify(anyString())).thenThrow(new IOException("Connection timed out"));

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.CUSTOMER);
        request.setCredential(MOCK_CREDENTIAL);

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(rse.getReason()).contains("Unable to reach Google identity servers");
                });
    }

    @Test
    @DisplayName("Token missing stable Google sub identifier throws 400 Bad Request")
    void testMissingSubRejected() throws Exception {
        GoogleIdToken token = createMockIdToken("user@example.com", true, null, TEST_CLIENT_ID);
        when(mockVerifier.verify(MOCK_CREDENTIAL)).thenReturn(token);

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.CUSTOMER);
        request.setCredential(MOCK_CREDENTIAL);

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("missing stable subject identifier (sub)");
                });
    }

    @Test
    @DisplayName("Unverified Google email address throws 400 Bad Request")
    void testUnverifiedEmailRejected() throws Exception {
        GoogleIdToken token = createMockIdToken("unverified@example.com", false, "google-sub-123", TEST_CLIENT_ID);
        when(mockVerifier.verify(MOCK_CREDENTIAL)).thenReturn(token);

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.CUSTOMER);
        request.setCredential(MOCK_CREDENTIAL);

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Unverified Google email address");
                });
    }

    @Test
    @DisplayName("Token with mismatched audience throws 401 Unauthorized")
    void testAudienceMismatchRejected() throws Exception {
        GoogleIdToken token = createMockIdToken("user@example.com", true, "google-sub-123", "foreign-client-id");
        when(mockVerifier.verify(MOCK_CREDENTIAL)).thenReturn(token);

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.CUSTOMER);
        request.setCredential(MOCK_CREDENTIAL);

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(rse.getReason()).contains("Google token audience mismatch");
                });
    }

    @Test
    @DisplayName("Existing ADMIN account cannot be accessed or logged into via Google OAuth (403 Forbidden)")
    void testAdminAccountCannotBeAccessedViaGoogle() throws Exception {
        GoogleIdToken token = createMockIdToken("admin@shopivo.com", true, "google-sub-admin", TEST_CLIENT_ID);
        when(mockVerifier.verify(MOCK_CREDENTIAL)).thenReturn(token);

        User existingAdmin = User.builder()
                .id(1L)
                .email("admin@shopivo.com")
                .role(User.Role.ADMIN)
                .enabled(true)
                .build();
        when(userRepository.findByEmail("admin@shopivo.com")).thenReturn(Optional.of(existingAdmin));

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.CUSTOMER); // Trying to sneak into admin account via customer portal
        request.setCredential(MOCK_CREDENTIAL);

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("Administrator accounts cannot sign in via Google OAuth");
                });
    }

    @Test
    @DisplayName("Role mismatch: Registered Customer attempting to sign in via Seller portal throws 409 Conflict")
    void testRoleMismatchCustomerToSeller() throws Exception {
        GoogleIdToken token = createMockIdToken("customer@shopivo.demo", true, "google-sub-cust", TEST_CLIENT_ID);
        when(mockVerifier.verify(MOCK_CREDENTIAL)).thenReturn(token);

        User existingCustomer = User.builder()
                .id(2L)
                .email("customer@shopivo.demo")
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build();
        when(userRepository.findByEmail("customer@shopivo.demo")).thenReturn(Optional.of(existingCustomer));

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.SELLER);
        request.setCredential(MOCK_CREDENTIAL);

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(rse.getReason()).contains("This account is registered as CUSTOMER. Please sign in through the CUSTOMER Portal.");
                });
    }

    @Test
    @DisplayName("Disabled or suspended account throws 403 Forbidden")
    void testDisabledAccountRejected() throws Exception {
        GoogleIdToken token = createMockIdToken("suspended@shopivo.demo", true, "google-sub-susp", TEST_CLIENT_ID);
        when(mockVerifier.verify(MOCK_CREDENTIAL)).thenReturn(token);

        User suspendedUser = User.builder()
                .id(3L)
                .email("suspended@shopivo.demo")
                .role(User.Role.SELLER)
                .enabled(false)
                .build();
        when(userRepository.findByEmail("suspended@shopivo.demo")).thenReturn(Optional.of(suspendedUser));

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.SELLER);
        request.setCredential(MOCK_CREDENTIAL);

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("pending administrative verification or has been suspended");
                });
    }

    @Test
    @DisplayName("Existing Customer successfully signs in via Google without account duplication")
    void testExistingCustomerSignInSuccess() throws Exception {
        GoogleIdToken token = createMockIdToken("ravi.kumar@shopivo.demo", true, "sub-ravi-123", TEST_CLIENT_ID);
        when(mockVerifier.verify(MOCK_CREDENTIAL)).thenReturn(token);

        User existingCustomer = User.builder()
                .id(10L)
                .email("ravi.kumar@shopivo.demo")
                .firstName("Ravi")
                .lastName("Kumar")
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build();
        when(userRepository.findByEmail("ravi.kumar@shopivo.demo")).thenReturn(Optional.of(existingCustomer));
        when(jwtUtil.generateToken(10L, "CUSTOMER")).thenReturn("jwt.token.customer.123");

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.CUSTOMER);
        request.setCredential(MOCK_CREDENTIAL);

        AuthResponse response = googleAuthService.authenticateWithGoogle(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("jwt.token.customer.123");
        assertThat(response.getUser().getEmail()).isEqualTo("ravi.kumar@shopivo.demo");
        assertThat(response.getUser().getRole()).isEqualTo("CUSTOMER");

        // Crucial: verify that save was NOT called, preventing duplicate user insertion
        verify(userRepository, never()).save(any(User.class));
        verify(eventLoggingService).logEvent(eq(EventType.LOGIN_SUCCESS), eq(existingCustomer), eq("USER"), eq("10"), anyMap());
    }

    @Test
    @DisplayName("New Customer registration via Google creates user with CUSTOMER role and enabled status")
    void testNewCustomerRegistrationSuccess() throws Exception {
        GoogleIdToken token = createMockIdToken("newshopper@gmail.com", true, "sub-newshopper-999", TEST_CLIENT_ID);
        when(mockVerifier.verify(MOCK_CREDENTIAL)).thenReturn(token);
        when(userRepository.findByEmail("newshopper@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_random_secret");

        User savedUser = User.builder()
                .id(55L)
                .email("newshopper@gmail.com")
                .firstName("Test")
                .lastName("User")
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generateToken(55L, "CUSTOMER")).thenReturn("jwt.token.newcustomer.55");

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.CUSTOMER);
        request.setCredential(MOCK_CREDENTIAL);

        AuthResponse response = googleAuthService.authenticateWithGoogle(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("jwt.token.newcustomer.55");
        assertThat(response.getUser().getEmail()).isEqualTo("newshopper@gmail.com");
        assertThat(response.getUser().getRole()).isEqualTo("CUSTOMER");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User capturedUser = userCaptor.getValue();
        assertThat(capturedUser.getEmail()).isEqualTo("newshopper@gmail.com");
        assertThat(capturedUser.getRole()).isEqualTo(User.Role.CUSTOMER);
        assertThat(capturedUser.isEnabled()).isTrue();

        verify(eventLoggingService).logEvent(eq(EventType.REGISTRATION), eq(savedUser), eq("USER"), eq("55"), anyMap());
        verify(eventLoggingService).logEvent(eq(EventType.LOGIN_SUCCESS), eq(savedUser), eq("USER"), eq("55"), anyMap());
    }

    @Test
    @DisplayName("New Seller registration via Google creates merchant with SELLER role")
    void testNewSellerRegistrationSuccess() throws Exception {
        GoogleIdToken token = createMockIdToken("newmerchant@gmail.com", true, "sub-merchant-888", TEST_CLIENT_ID);
        when(mockVerifier.verify(MOCK_CREDENTIAL)).thenReturn(token);
        when(userRepository.findByEmail("newmerchant@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_random_secret");

        User savedSeller = User.builder()
                .id(77L)
                .email("newmerchant@gmail.com")
                .firstName("Test")
                .lastName("Smart Electronics")
                .role(User.Role.SELLER)
                .enabled(true)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedSeller);
        when(jwtUtil.generateToken(77L, "SELLER")).thenReturn("jwt.token.newseller.77");

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.SELLER);
        request.setStoreName("Smart Electronics");
        request.setCredential(MOCK_CREDENTIAL);

        AuthResponse response = googleAuthService.authenticateWithGoogle(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("jwt.token.newseller.77");
        assertThat(response.getUser().getRole()).isEqualTo("SELLER");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User capturedUser = userCaptor.getValue();
        assertThat(capturedUser.getRole()).isEqualTo(User.Role.SELLER);
        assertThat(capturedUser.isEnabled()).isTrue();
    }

    @Test
    @DisplayName("When seller approval policy is enabled, new seller is registered as disabled (403 Forbidden)")
    void testNewSellerWithApprovalPolicyRequired() throws Exception {
        ReflectionTestUtils.setField(googleAuthService, "requireSellerApproval", true);

        GoogleIdToken token = createMockIdToken("pendingmerchant@gmail.com", true, "sub-pending-777", TEST_CLIENT_ID);
        when(mockVerifier.verify(MOCK_CREDENTIAL)).thenReturn(token);
        when(userRepository.findByEmail("pendingmerchant@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_random_secret");

        User pendingSeller = User.builder()
                .id(88L)
                .email("pendingmerchant@gmail.com")
                .role(User.Role.SELLER)
                .enabled(false)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(pendingSeller);

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setPortalRole(User.Role.SELLER);
        request.setStoreName("Pending Store");
        request.setCredential(MOCK_CREDENTIAL);

        assertThatThrownBy(() -> googleAuthService.authenticateWithGoogle(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("pending administrative approval before activation");
                });

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().isEnabled()).isFalse();
        verify(eventLoggingService).logEvent(eq(EventType.REGISTRATION), eq(pendingSeller), eq("USER"), eq("88"), anyMap());
        verify(eventLoggingService, never()).logEvent(eq(EventType.LOGIN_SUCCESS), any(User.class), any(), any(), any());
    }
}
