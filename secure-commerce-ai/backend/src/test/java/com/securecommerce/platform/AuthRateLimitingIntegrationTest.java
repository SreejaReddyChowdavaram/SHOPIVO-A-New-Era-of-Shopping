package com.securecommerce.platform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.securecommerce.platform.auth.dto.LoginRequest;
import com.securecommerce.platform.auth.dto.RegisterRequest;
import com.securecommerce.platform.security.service.RateLimiterService;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthRateLimitingIntegrationTest — Integration test suite verifying API rate limiting
 * on authentication endpoints (POST /api/auth/login and POST /api/auth/register).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AuthRateLimitingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RateLimiterService rateLimiterService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        rateLimiterService.resetAll();
    }

    @Test
    @DisplayName("Login requests below limit are allowed to proceed through authentication")
    void testLoginAllowedBelowLimit() throws Exception {
        String clientIp = "10.0.0.1";
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nonexistent@shopivo.test");
        loginRequest.setPassword("WrongPassword123!");

        // 10 attempts allowed under default login window
        for (int i = 1; i <= 10; i++) {
            mockMvc.perform(post("/auth/login")
                            .with(req -> {
                                req.setRemoteAddr(clientIp);
                                return req;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized()); // Bad credentials, but NOT rate limited (429)
        }
    }

    @Test
    @DisplayName("11th login attempt within the time window returns HTTP 429 Too Many Requests")
    void testLoginExceededReturns429() throws Exception {
        String clientIp = "10.0.0.2";
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nonexistent@shopivo.test");
        loginRequest.setPassword("WrongPassword123!");

        for (int i = 1; i <= 10; i++) {
            mockMvc.perform(post("/auth/login")
                            .with(req -> {
                                req.setRemoteAddr(clientIp);
                                return req;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized());
        }

        // 11th request must be rejected with HTTP 429
        mockMvc.perform(post("/auth/login")
                        .with(req -> {
                            req.setRemoteAddr(clientIp);
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Too many login attempts")))
                .andExpect(jsonPath("$.errors.code", is("RATE_LIMIT_EXCEEDED")))
                .andExpect(jsonPath("$.errors.endpoint", is("login")))
                .andExpect(jsonPath("$.errors.retryAfterSeconds", greaterThan(0)));
    }

    @Test
    @DisplayName("Registration requests below limit are allowed to proceed")
    void testRegisterAllowedBelowLimit() throws Exception {
        String clientIp = "10.0.0.3";

        // 5 registration attempts allowed under default window
        for (int i = 1; i <= 5; i++) {
            RegisterRequest registerRequest = new RegisterRequest();
            registerRequest.setFirstName("Test");
            registerRequest.setLastName("User" + i);
            registerRequest.setEmail("ratelimit_allowed_" + i + "@shopivo.test");
            registerRequest.setPassword("Password123!");
            registerRequest.setRole(User.Role.CUSTOMER);

            mockMvc.perform(post("/auth/register")
                            .with(req -> {
                                req.setRemoteAddr(clientIp);
                                return req;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(registerRequest)))
                    .andExpect(status().isCreated());
        }
    }

    @Test
    @DisplayName("6th registration attempt within the time window returns HTTP 429 Too Many Requests")
    void testRegisterExceededReturns429() throws Exception {
        String clientIp = "10.0.0.4";

        for (int i = 1; i <= 5; i++) {
            RegisterRequest registerRequest = new RegisterRequest();
            registerRequest.setFirstName("Test");
            registerRequest.setLastName("User" + i);
            registerRequest.setEmail("ratelimit_exceed_" + i + "@shopivo.test");
            registerRequest.setPassword("Password123!");
            registerRequest.setRole(User.Role.CUSTOMER);

            mockMvc.perform(post("/auth/register")
                            .with(req -> {
                                req.setRemoteAddr(clientIp);
                                return req;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(registerRequest)))
                    .andExpect(status().isCreated());
        }

        // 6th attempt must be rejected with HTTP 429
        RegisterRequest excessRequest = new RegisterRequest();
        excessRequest.setFirstName("Excess");
        excessRequest.setLastName("User");
        excessRequest.setEmail("ratelimit_exceed_6@shopivo.test");
        excessRequest.setPassword("Password123!");
        excessRequest.setRole(User.Role.CUSTOMER);

        mockMvc.perform(post("/auth/register")
                        .with(req -> {
                            req.setRemoteAddr(clientIp);
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(excessRequest)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Too many register attempts")))
                .andExpect(jsonPath("$.errors.code", is("RATE_LIMIT_EXCEEDED")))
                .andExpect(jsonPath("$.errors.endpoint", is("register")))
                .andExpect(jsonPath("$.errors.retryAfterSeconds", greaterThan(0)));
    }

    @Test
    @DisplayName("Separate client IP addresses have independent rate limits")
    void testSeparateIpsHaveIndependentLimits() throws Exception {
        String clientIpA = "192.168.1.10";
        String clientIpB = "192.168.1.20";

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("anyone@shopivo.test");
        loginRequest.setPassword("WrongPassword123!");

        // Exhaust limit for Client IP A
        for (int i = 1; i <= 10; i++) {
            mockMvc.perform(post("/auth/login")
                            .with(req -> {
                                req.setRemoteAddr(clientIpA);
                                return req;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized());
        }

        // Client IP A is now rate-limited
        mockMvc.perform(post("/auth/login")
                        .with(req -> {
                            req.setRemoteAddr(clientIpA);
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isTooManyRequests());

        // Client IP B must NOT be affected and is allowed through
        mockMvc.perform(post("/auth/login")
                        .with(req -> {
                            req.setRemoteAddr(clientIpB);
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized()); // Processed by auth flow, not throttled
    }

    @Test
    @DisplayName("Rate limit resets after configured time window elapses")
    void testRateLimitResetsAfterWindow() throws Exception {
        String clientIp = "10.0.0.30";
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@shopivo.test");
        loginRequest.setPassword("WrongPassword123!");

        // Exhaust limit
        for (int i = 1; i <= 10; i++) {
            mockMvc.perform(post("/auth/login")
                            .with(req -> {
                                req.setRemoteAddr(clientIp);
                                return req;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized());
        }

        // Verify blocked
        mockMvc.perform(post("/auth/login")
                        .with(req -> {
                            req.setRemoteAddr(clientIp);
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isTooManyRequests());

        // Simulate 61 seconds passing by moving the bucket window into the past
        rateLimiterService.advanceLoginWindowForTesting(clientIp, 61000L);

        // Next request must be allowed again
        mockMvc.perform(post("/auth/login")
                        .with(req -> {
                            req.setRemoteAddr(clientIp);
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized()); // Passed rate limiter to auth layer
    }

    @Test
    @DisplayName("Spoofed X-Forwarded-For headers are ignored when trusted-proxy is disabled")
    void testSpoofedForwardedForHeaderIgnoredWhenProxyUntrusted() throws Exception {
        String realIp = "10.0.0.40";
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("attacker@shopivo.test");
        loginRequest.setPassword("WrongPassword123!");

        // Attacker attempts 10 times from real IP, trying to spoof X-Forwarded-For
        for (int i = 1; i <= 10; i++) {
            mockMvc.perform(post("/auth/login")
                            .with(req -> {
                                req.setRemoteAddr(realIp);
                                return req;
                            })
                            .header("X-Forwarded-For", "203.0.113." + i)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized());
        }

        // 11th request with yet another spoofed IP must STILL be blocked because real RemoteAddr is used
        mockMvc.perform(post("/auth/login")
                        .with(req -> {
                            req.setRemoteAddr(realIp);
                            return req;
                        })
                        .header("X-Forwarded-For", "198.51.100.99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.errors.code", is("RATE_LIMIT_EXCEEDED")));
    }

    @Test
    @DisplayName("Successful authentication proceeds normally without interference from rate limiter")
    void testSuccessfulLoginProceedsNormally() throws Exception {
        String clientIp = "10.0.0.50";
        String email = "legit_user@shopivo.test";
        String password = "CorrectPassword123!";

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFirstName("Legit");
        user.setLastName("Customer");
        user.setRole(User.Role.CUSTOMER);
        user.setEnabled(true);
        userRepository.save(user);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword(password);

        mockMvc.perform(post("/auth/login")
                        .with(req -> {
                            req.setRemoteAddr(clientIp);
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is(email)));
    }

    @Test
    @DisplayName("Non-auth endpoints are not affected by authentication rate limiting")
    void testNonAuthEndpointsNotThrottled() throws Exception {
        String clientIp = "10.0.0.60";

        // Exhaust login limit for this IP
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@shopivo.test");
        loginRequest.setPassword("WrongPassword123!");

        for (int i = 1; i <= 10; i++) {
            mockMvc.perform(post("/auth/login")
                            .with(req -> {
                                req.setRemoteAddr(clientIp);
                                return req;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized());
        }

        // Login is now blocked
        mockMvc.perform(post("/auth/login")
                        .with(req -> {
                            req.setRemoteAddr(clientIp);
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isTooManyRequests());

        // Public GET endpoint (e.g., /products or /actuator/health) must NOT be blocked
        mockMvc.perform(get("/products")
                        .with(req -> {
                            req.setRemoteAddr(clientIp);
                            return req;
                        }))
                .andExpect(status().isOk());
    }
}
