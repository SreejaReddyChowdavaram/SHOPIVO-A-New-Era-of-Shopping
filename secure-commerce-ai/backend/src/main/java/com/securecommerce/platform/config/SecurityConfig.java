package com.securecommerce.platform.config;

import com.securecommerce.platform.security.filter.JwtAuthFilter;
import com.securecommerce.platform.security.filter.RateLimitingFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * SecurityConfig — Updated for JWT Authentication
 *
 * CHANGES FROM INITIALIZATION PHASE:
 *   - JwtAuthFilter injected and added to the filter chain
 *   - /api/auth/** is public (register, login don't need a token)
 *   - /api/actuator/health is public (monitoring)
 *   - Everything else requires authentication
 *
 * HOW addFilterBefore WORKS:
 *   Spring Security processes filters in order. By adding JwtAuthFilter
 *   BEFORE UsernamePasswordAuthenticationFilter, JWT auth runs first.
 *   If the JWT is valid, the SecurityContext is populated and
 *   UsernamePasswordAuthenticationFilter sees an already-authenticated request.
 *
 * WHAT "authenticated()" MEANS:
 *   The SecurityContext must have a non-null, authenticated principal.
 *   JwtAuthFilter sets this if the token is valid.
 *   If no token → no auth → Spring returns 401 automatically.
 *
 * @EnableMethodSecurity: Allows @PreAuthorize on individual controller methods.
 *   Example: @PreAuthorize("hasRole('ADMIN')") on admin-only endpoints.
 *   This is the fine-grained layer ABOVE the URL-based rules here.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final RateLimitingFilter rateLimitingFilter;

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String configuredCorsOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED)))
            .authorizeHttpRequests(auth -> auth
                // ── Public: Root and Auth ────────────────────────
                .requestMatchers("/").permitAll()
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/payments/webhook/**").permitAll()

                // ── Public: Product browse, categories, reviews and uploaded images ────────
                // Customers (even logged-out guests) can browse products, reviews and view uploaded images
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/products/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/categories/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/reviews/product/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/uploads/**").permitAll()

                // ── Health check ──────────────────────────────────
                .requestMatchers("/actuator/health").permitAll()

                // ── Seller-only endpoints ─────────────────────────
                .requestMatchers("/seller", "/seller/**").hasRole("SELLER")

                // ── Admin-only endpoints ──────────────────────────
                .requestMatchers("/admin", "/admin/**").hasRole("ADMIN")

                // ── Cart & Wishlist & Addresses: CUSTOMER only ────
                .requestMatchers("/cart", "/cart/**").hasRole("CUSTOMER")
                .requestMatchers("/wishlist", "/wishlist/**").hasRole("CUSTOMER")
                .requestMatchers("/addresses", "/addresses/**").hasRole("CUSTOMER")

                // ── Orders, Payments, Reviews, Returns, Notifications & Coupons: Authenticated (further secured by @PreAuthorize on controllers)
                .requestMatchers("/orders", "/orders/**").authenticated()
                .requestMatchers("/payments", "/payments/**").authenticated()
                .requestMatchers("/returns", "/returns/**").authenticated()
                .requestMatchers("/notifications", "/notifications/**").authenticated()
                .requestMatchers("/coupons", "/coupons/**").authenticated()

                // ── Everything else requires authentication ───────
                .anyRequest().authenticated()
            )
            // Rate limiting runs after CORS and before authentication filters
            .addFilterBefore(rateLimitingFilter, org.springframework.security.web.authentication.logout.LogoutFilter.class)
            // Add JWT filter before the default username/password filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        java.util.Set<String> allowedOrigins = new java.util.LinkedHashSet<>();
        allowedOrigins.add("http://localhost:5173");
        allowedOrigins.add("http://localhost:3000");

        if (configuredCorsOrigins != null && !configuredCorsOrigins.isBlank()) {
            for (String origin : configuredCorsOrigins.split(",")) {
                String trimmed = origin.trim();
                // Ensure wildcard is never allowed when credentials are supported
                if (!trimmed.isEmpty() && !trimmed.equals("*")) {
                    allowedOrigins.add(trimmed);
                }
            }
        }

        config.setAllowedOriginPatterns(new java.util.ArrayList<>(allowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("X-Session-Id", "Content-Disposition"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
