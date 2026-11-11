package com.securecommerce.platform.auth.service;

import com.securecommerce.platform.auth.dto.AuthResponse;
import com.securecommerce.platform.auth.dto.LoginRequest;
import com.securecommerce.platform.auth.dto.RegisterRequest;
import com.securecommerce.platform.auth.exception.DuplicateEmailException;
import com.securecommerce.platform.auth.exception.InvalidCredentialsException;
import com.securecommerce.platform.event.service.EventLoggingService;
import com.securecommerce.platform.event.service.LoginActivityService;
import com.securecommerce.platform.security.util.JwtUtil;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private EventLoggingService eventLoggingService;

    @Mock
    private LoginActivityService loginActivityService;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Password login on account registered with Google returns distinct message directing to Google Sign-In")
    void testGoogleRegisteredAccountThrowsGoogleAuthRequired() {
        String email = "googleuser@gmail.com";
        User googleUser = User.builder()
                .id(50L)
                .email(email)
                .role(User.Role.CUSTOMER)
                .authProvider(User.AuthProvider.GOOGLE)
                .passwordHash("random_unusable_hash")
                .enabled(true)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(googleUser));

        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword("AttemptedPassword123!");
        request.setPortalRole(User.Role.CUSTOMER);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).isEqualTo("This email is registered with Google. Please continue with Google Sign-In.");
                });

        verify(loginActivityService).recordLoginFailure(
                eq(email), eq("CUSTOMER"), eq("PASSWORD"), eq("GOOGLE_AUTH_REQUIRED"), eq(50L)
        );
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    @DisplayName("Password login on LINKED account succeeds with correct password")
    void testLinkedAccountPasswordLoginSucceeds() {
        String email = "linkeduser@shopivo.test";
        User linkedUser = User.builder()
                .id(51L)
                .email(email)
                .role(User.Role.CUSTOMER)
                .authProvider(User.AuthProvider.LINKED)
                .passwordHash("encoded_valid_password")
                .enabled(true)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(linkedUser));
        when(passwordEncoder.matches("ValidPassword123!", "encoded_valid_password")).thenReturn(true);
        when(jwtUtil.generateToken(51L, "CUSTOMER")).thenReturn("token_123");

        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword("ValidPassword123!");
        request.setPortalRole(User.Role.CUSTOMER);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("token_123");
        verify(loginActivityService).recordLoginSuccess(linkedUser, "PASSWORD");
    }

    @Test
    @DisplayName("Password login on LOCAL account succeeds with correct password")
    void testLocalAccountPasswordLoginSucceeds() {
        String email = "localuser@shopivo.test";
        User localUser = User.builder()
                .id(52L)
                .email(email)
                .role(User.Role.CUSTOMER)
                .authProvider(User.AuthProvider.LOCAL)
                .passwordHash("encoded_valid_password")
                .enabled(true)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(localUser));
        when(passwordEncoder.matches("ValidPassword123!", "encoded_valid_password")).thenReturn(true);
        when(jwtUtil.generateToken(52L, "CUSTOMER")).thenReturn("token_456");

        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword("ValidPassword123!");
        request.setPortalRole(User.Role.CUSTOMER);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("token_456");
        verify(loginActivityService).recordLoginSuccess(localUser, "PASSWORD");
    }
}

