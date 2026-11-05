package com.securecommerce.platform.auth.service;

import com.securecommerce.platform.auth.dto.AuthResponse;
import com.securecommerce.platform.auth.dto.LoginRequest;
import com.securecommerce.platform.auth.dto.RegisterRequest;
import com.securecommerce.platform.auth.exception.DuplicateEmailException;
import com.securecommerce.platform.auth.exception.InvalidCredentialsException;
import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.service.EventLoggingService;
import com.securecommerce.platform.security.util.JwtUtil;
import com.securecommerce.platform.user.dto.UserResponse;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

/**
 * AuthService — Business Logic for Registration and Login
 *
 * Instrumented with EventLoggingService to capture REGISTRATION, LOGIN_SUCCESS,
 * and LOGIN_FAILURE events for research data collection.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;   // BCryptPasswordEncoder from SecurityConfig
    private final JwtUtil jwtUtil;
    private final EventLoggingService eventLoggingService;

    /**
     * Register a new user account.
     */
    public AuthResponse register(RegisterRequest request) {
        // 1. Check for duplicate email
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new DuplicateEmailException(
                "An account with email '" + request.getEmail() + "' already exists"
            );
        }

        // 2. Validate role: self-registration as ADMIN is forbidden
        if (request.getRole() == User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Self-registration as ADMIN is not permitted");
        }

        // 3. Build user entity with hashed password
        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .role(request.getRole())
                .enabled(true)
                .build();

        // 3. Save to database (Flyway created the table, Hibernate validates the entity)
        User savedUser = userRepository.save(user);
        log.info("New user registered: id={}, email={}, role={}",
                savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

        // 4. Log REGISTRATION event
        eventLoggingService.logEvent(
                EventType.REGISTRATION,
                savedUser,
                "USER",
                String.valueOf(savedUser.getId()),
                Map.of("email", savedUser.getEmail(), "role", savedUser.getRole().name())
        );

        // 5. Generate JWT and return response
        return buildAuthResponse(savedUser);
    }

    /**
     * Authenticate a user with email and password.
     */
    public AuthResponse login(LoginRequest request) {
        String attemptedEmail = request.getEmail() != null ? request.getEmail().toLowerCase().trim() : "";

        // 1. Find by email (case-insensitive)
        Optional<User> userOpt = userRepository.findByEmail(attemptedEmail);
        if (userOpt.isEmpty()) {
            eventLoggingService.logEvent(
                    EventType.LOGIN_FAILURE,
                    (User) null,
                    "USER",
                    null,
                    Map.of("attemptedEmail", attemptedEmail, "reasonCategory", "USER_NOT_FOUND")
            );
            throw new InvalidCredentialsException();
        }

        User user = userOpt.get();

        // 2. Verify password — BCrypt compares plain text against stored hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            eventLoggingService.logEvent(
                    EventType.LOGIN_FAILURE,
                    user,
                    "USER",
                    String.valueOf(user.getId()),
                    Map.of("attemptedEmail", attemptedEmail, "reasonCategory", "INVALID_CREDENTIALS")
            );
            throw new InvalidCredentialsException();
        }

        // 3. Check account is active
        if (!user.isEnabled()) {
            eventLoggingService.logEvent(
                    EventType.LOGIN_FAILURE,
                    user,
                    "USER",
                    String.valueOf(user.getId()),
                    Map.of("attemptedEmail", attemptedEmail, "reasonCategory", "ACCOUNT_DISABLED")
            );
            throw new InvalidCredentialsException("Account is disabled. Please contact support.");
        }

        log.info("User logged in: id={}, role={}", user.getId(), user.getRole());

        // 4. Log successful login
        eventLoggingService.logEvent(
                EventType.LOGIN_SUCCESS,
                user,
                "USER",
                String.valueOf(user.getId()),
                Map.of("email", user.getEmail(), "role", user.getRole().name())
        );

        // 5. Generate JWT and return response
        return buildAuthResponse(user);
    }

    /**
     * Get user data for an already-authenticated request.
     * Called by GET /api/auth/me — the JwtAuthFilter already validated the token
     * and set the SecurityContext. The controller passes the User principal here.
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(User user) {
        return UserResponse.from(user);
    }

    // ─── Private helpers ──────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtUtil.generateToken(user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .accessToken(token)
                .user(UserResponse.from(user))
                .build();
    }
}
