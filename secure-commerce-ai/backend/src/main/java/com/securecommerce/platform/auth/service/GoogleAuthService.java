package com.securecommerce.platform.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.securecommerce.platform.auth.dto.AuthResponse;
import com.securecommerce.platform.auth.dto.GoogleAuthRequest;
import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.service.EventLoggingService;
import com.securecommerce.platform.event.service.LoginActivityService;
import com.securecommerce.platform.security.util.JwtUtil;
import com.securecommerce.platform.user.dto.UserResponse;
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

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * GoogleAuthService — Enterprise-Grade Google OAuth 2.0 / OIDC ID Token Verification
 *
 * Implements Google's recommended official Java SDK (GoogleIdTokenVerifier) for production token validation:
 * 1. Cryptographic token signature verification against Google's public key infrastructure (JWKS).
 * 2. Audience validation (must match configured Web Client ID).
 * 3. Issuer validation (accounts.google.com or https://accounts.google.com).
 * 4. Token expiration verification (exp timestamp against current time with clock skew window).
 * 5. Strict email verification check (email_verified must be true).
 * 6. Stable Google subject identifier (sub) verification.
 * 7. Strict administrator protection:
 *    - Google auth CANNOT create an ADMIN account.
 *    - Google auth CANNOT authenticate an existing ADMIN account.
 *    - Google auth CANNOT promote CUSTOMER or SELLER to ADMIN.
 * 8. Strict role separation:
 *    - Conflicting portal access (e.g. CUSTOMER trying to sign into SELLER portal) is rejected with HTTP 409 CONFLICT.
 * 9. Seller verification & approval compliance:
 *    - Respects seller approval requirements (SELLER_REQUIRE_APPROVAL policy).
 * 10. Account deduplication:
 *    - Existing accounts are retrieved and verified without creating duplicate user records.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EventLoggingService eventLoggingService;
    private final LoginActivityService loginActivityService;

    @Value("${app.google.client-id:${GOOGLE_CLIENT_ID:}}")
    private String configuredGoogleClientId;

    @Value("${app.seller.require-approval:${SELLER_REQUIRE_APPROVAL:false}}")
    private boolean requireSellerApproval;

    // Google API Client Transport & JsonFactory
    private final HttpTransport transport = new NetHttpTransport();
    private final JsonFactory jsonFactory = GsonFactory.getDefaultInstance();

    // Verifier instance (cached after initialization or injected for testing)
    private GoogleIdTokenVerifier tokenVerifier;

    public synchronized GoogleIdTokenVerifier getVerifier() {
        if (tokenVerifier == null) {
            GoogleIdTokenVerifier.Builder builder = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
                    .setIssuers(Arrays.asList("https://accounts.google.com", "accounts.google.com"));

            String clientId = configuredGoogleClientId != null ? configuredGoogleClientId.trim() : "";
            if (!clientId.isEmpty() && !clientId.contains("placeholder")) {
                builder.setAudience(Collections.singletonList(clientId));
            }

            tokenVerifier = builder.build();
        }
        return tokenVerifier;
    }

    public void setTokenVerifier(GoogleIdTokenVerifier customVerifier) {
        this.tokenVerifier = customVerifier;
    }

    /**
     * Authenticate or register a user via Google OAuth 2.0 / OIDC ID Token.
     *
     * @param request GoogleAuthRequest containing credential, portalRole, storeName
     * @return AuthResponse containing SHOPIVO JWT and user profile
     */
    public AuthResponse authenticateWithGoogle(GoogleAuthRequest request) {
        // 1. Strict restriction: ADMIN accounts cannot use Google Sign-In
        if (request.getPortalRole() == User.Role.ADMIN) {
            log.warn("Security Alert: Blocked attempt to authenticate or register ADMIN role via Google OAuth");
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Google authentication cannot be used for Administrator access. Administrator accounts require authorized credentials."
            );
        }

        // 2. Validate incoming credential string
        String credential = request.getCredential();
        if (credential == null || credential.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Missing Google authentication credential."
            );
        }

        // 3. Verify Google ID token using GoogleIdTokenVerifier
        GoogleIdToken idToken = verifyGoogleIdToken(credential.trim());

        if (idToken == null) {
            log.warn("Google ID token verification failed: null token returned (invalid signature, audience mismatch, or expired token)");
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid, expired, or untrusted Google authentication credential."
            );
        }

        Payload payload = idToken.getPayload();

        // 4. Validate audience if GOOGLE_CLIENT_ID is configured
        String expectedClientId = configuredGoogleClientId != null ? configuredGoogleClientId.trim() : "";
        if (!expectedClientId.isEmpty() && !expectedClientId.contains("placeholder")) {
            Object audObj = payload.getAudience();
            boolean audMatch = false;
            if (audObj instanceof String && expectedClientId.equals(audObj)) {
                audMatch = true;
            } else if (audObj instanceof java.util.List<?>) {
                audMatch = ((java.util.List<?>) audObj).contains(expectedClientId);
            }
            if (!audMatch) {
                log.warn("Google token audience mismatch. Expected: {}, Received: {}", expectedClientId, audObj);
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Google token audience mismatch. Token was not issued for this application."
                );
            }
        }

        // 5. Verify stable Google subject ID (sub)
        String sub = payload.getSubject();
        if (sub == null || sub.trim().isEmpty()) {
            log.warn("Google token missing stable subject identifier (sub)");
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Google token missing stable subject identifier (sub)."
            );
        }

        // 6. Verify verified email
        Boolean emailVerified = payload.getEmailVerified();
        if (emailVerified == null || !emailVerified) {
            log.warn("Google ID token email is not verified: {}", payload.getEmail());
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unverified Google email address. A verified Google account is required."
            );
        }

        // 7. Extract email
        String email = payload.getEmail();
        if (email == null || email.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Google token did not contain an email address."
            );
        }
        email = email.toLowerCase().trim();

        // 8. Extract profile information
        String givenName = (String) payload.get("given_name");
        String familyName = (String) payload.get("family_name");
        String name = (String) payload.get("name");

        if (givenName == null || givenName.trim().isEmpty()) {
            givenName = (name != null && !name.trim().isEmpty())
                    ? name.trim()
                    : (request.getPortalRole() == User.Role.SELLER ? "Merchant" : "Customer");
        }
        if (familyName == null || familyName.trim().isEmpty()) {
            familyName = request.getPortalRole() == User.Role.SELLER
                    ? (request.getStoreName() != null && !request.getStoreName().isBlank() ? request.getStoreName().trim() : "Store")
                    : "User";
        }

        // 9. Lookup existing user or register new user (Prevent account duplication)
        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        User user;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();

            // Strict security check: NEVER allow Google to access an ADMIN account
            if (user.getRole() == User.Role.ADMIN) {
                log.warn("Security Alert: Blocked attempt to sign in to ADMIN account ({}) via Google OAuth", email);
                loginActivityService.recordLoginFailure(email, "ADMIN", "GOOGLE_OAUTH", "ADMIN_FORBIDDEN", user.getId());
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Administrator accounts cannot sign in via Google OAuth. Authorized internal credentials are required."
                );
            }

            // Strict role verification: Reject cross-role portal access
            if (user.getRole() != request.getPortalRole()) {
                log.warn("Google auth role mismatch: user {} is registered as {}, but attempted login via {} Portal",
                        email, user.getRole(), request.getPortalRole());
                loginActivityService.recordLoginFailure(email, user.getRole().name(), "GOOGLE_OAUTH", "ROLE_MISMATCH", user.getId());
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "This account is registered as " + user.getRole() + ". Please sign in through the " + user.getRole() + " Portal."
                );
            }

            // Verify account status (active vs suspended / pending verification)
            if (!user.isEnabled()) {
                log.warn("Google auth attempt for disabled/suspended account: {}", email);
                loginActivityService.recordLoginFailure(email, user.getRole().name(), "GOOGLE_OAUTH", "ACCOUNT_DISABLED", user.getId());
                String disabledMsg = user.getRole() == User.Role.SELLER
                        ? "Seller account is currently pending administrative verification or has been suspended. Please contact platform administration."
                        : "Account is disabled. Please contact customer support.";
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, disabledMsg);
            }

            // Safe account linking: if existing account was registered with LOCAL credentials,
            // upgrade provider to LINKED since Google has cryptographically verified this email.
            if (user.getAuthProvider() == User.AuthProvider.LOCAL) {
                user.setAuthProvider(User.AuthProvider.LINKED);
                user = userRepository.save(user);
                log.info("Safely linked Google authentication to existing local account: id={}, email={}", user.getId(), user.getEmail());
            }

            log.info("Existing {} authenticated via Google: id={}, email={}, sub={}, provider={}",
                    user.getRole(), user.getId(), user.getEmail(), sub, user.getAuthProvider());

            eventLoggingService.logEvent(
                    EventType.LOGIN_SUCCESS,
                    user,
                    "USER",
                    String.valueOf(user.getId()),
                    Map.of("email", user.getEmail(), "role", user.getRole().name(), "provider", "GOOGLE", "googleSub", sub)
            );
            loginActivityService.recordLoginSuccess(user, "GOOGLE_OAUTH");
        } else {
            // New user registration via Google
            boolean isSeller = (request.getPortalRole() == User.Role.SELLER);
            boolean initialEnabled = !(isSeller && requireSellerApproval);

            user = User.builder()
                    .email(email)
                    .firstName(givenName.trim())
                    .lastName(familyName.trim())
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(request.getPortalRole())
                    .authProvider(User.AuthProvider.GOOGLE)
                    .enabled(initialEnabled)
                    .build();

            user = userRepository.save(user);
            log.info("New {} registered via Google: id={}, email={}, sub={}, enabled={}",
                    user.getRole(), user.getId(), user.getEmail(), sub, user.isEnabled());

            eventLoggingService.logEvent(
                    EventType.REGISTRATION,
                    user,
                    "USER",
                    String.valueOf(user.getId()),
                    Map.of("email", user.getEmail(), "role", user.getRole().name(), "provider", "GOOGLE", "googleSub", sub)
            );

            // If seller requires admin verification and is not enabled, inform user
            if (!user.isEnabled()) {
                log.info("New seller {} registered and awaiting administrative verification", email);
                loginActivityService.recordLoginFailure(email, user.getRole().name(), "GOOGLE_OAUTH", "SELLER_PENDING_APPROVAL", user.getId());
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Seller account created successfully. Your store is pending administrative approval before activation."
                );
            }

            eventLoggingService.logEvent(
                    EventType.LOGIN_SUCCESS,
                    user,
                    "USER",
                    String.valueOf(user.getId()),
                    Map.of("email", user.getEmail(), "role", user.getRole().name(), "provider", "GOOGLE")
            );
            loginActivityService.recordLoginSuccess(user, "GOOGLE_OAUTH");
        }

        // 10. Issue SHOPIVO JWT
        String token = jwtUtil.generateToken(user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .accessToken(token)
                .user(UserResponse.from(user))
                .build();
    }

    /**
     * Verifies the ID token cryptographically using GoogleIdTokenVerifier.
     */
    private GoogleIdToken verifyGoogleIdToken(String idTokenString) {
        try {
            return getVerifier().verify(idTokenString);
        } catch (GeneralSecurityException e) {
            log.warn("Cryptographic token signature verification failed: {}", e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Cryptographic token verification failed: " + e.getMessage()
            );
        } catch (IOException e) {
            log.error("Network communication error with Google public key servers: {}", e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to reach Google identity servers. Please verify network connectivity."
            );
        } catch (IllegalArgumentException e) {
            log.warn("Malformed Google ID token format: {}", e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Malformed Google authentication credential."
            );
        } catch (Exception e) {
            log.warn("Token verification failed due to invalid token structure or claims: {}", e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid, expired, or untrusted Google authentication token."
            );
        }
    }
}
