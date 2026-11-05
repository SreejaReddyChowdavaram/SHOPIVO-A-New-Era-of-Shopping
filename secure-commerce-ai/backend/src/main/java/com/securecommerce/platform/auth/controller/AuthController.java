package com.securecommerce.platform.auth.controller;

import com.securecommerce.platform.auth.dto.AuthResponse;
import com.securecommerce.platform.auth.dto.LoginRequest;
import com.securecommerce.platform.auth.dto.RegisterRequest;
import com.securecommerce.platform.auth.service.AuthService;
import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.user.dto.UserResponse;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController — HTTP endpoints for authentication
 *
 * @RestController: Combines @Controller + @ResponseBody.
 *   Every method returns data serialized to JSON, not an HTML view.
 *
 * @RequestMapping("/auth"): All endpoints here are under /auth.
 *   Combined with the server context-path (/api), full paths are:
 *     POST http://localhost:8080/api/auth/register
 *     POST http://localhost:8080/api/auth/login
 *     GET  http://localhost:8080/api/auth/me
 *
 * @Valid: Triggers Jakarta validation on the request body.
 *   If validation fails, GlobalExceptionHandler returns 400 automatically.
 *   The controller method is never called.
 *
 * ResponseEntity<ApiResponse<T>>:
 *   ResponseEntity allows setting the HTTP status code explicitly.
 *   ApiResponse<T> is our wrapper to keep consistent response shape.
 *   register → 201 Created (resource was created)
 *   login    → 200 OK
 *
 * @AuthenticationPrincipal:
 *   Spring Security extracts the principal from the SecurityContext.
 *   JwtAuthFilter set the principal to the User entity (see JwtAuthFilter.java).
 *   So @AuthenticationPrincipal User user gives us the logged-in user directly.
 *   No need to call userRepository — Spring Security already did it.
 */
import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.service.EventLoggingService;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EventLoggingService eventLoggingService;

    /**
     * POST /api/auth/register
     * Creates a new account and returns a JWT immediately (no separate login needed).
     * Returns 201 Created with AuthResponse body.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {

        AuthResponse authData = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created successfully", authData));
    }

    /**
     * POST /api/auth/login
     * Authenticates with email + password, returns JWT on success.
     * Returns 200 OK with AuthResponse body.
     * Returns 401 Unauthorized (via GlobalExceptionHandler) on bad credentials.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        AuthResponse authData = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authData));
    }

    /**
     * GET /api/auth/me
     * Returns the currently authenticated user's profile.
     * Requires a valid JWT — SecurityConfig enforces this.
     * Returns 401 if no/invalid JWT provided.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal User currentUser) {

        UserResponse userResponse = authService.getCurrentUser(currentUser);
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved", userResponse));
    }

    /**
     * POST /api/auth/logout
     * Records the LOGOUT research event.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal User currentUser) {
        if (currentUser != null) {
            eventLoggingService.logEvent(
                    EventType.LOGOUT,
                    currentUser.getId(),
                    "USER",
                    String.valueOf(currentUser.getId()),
                    java.util.Map.of("email", currentUser.getEmail())
            );
        } else {
            eventLoggingService.logEvent(
                    EventType.LOGOUT,
                    (Long) null,
                    "USER",
                    null,
                    java.util.Map.of("status", "ANONYMOUS_LOGOUT")
            );
        }
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }
}
