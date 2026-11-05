package com.securecommerce.platform.security.filter;

import com.securecommerce.platform.security.util.JwtUtil;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JwtAuthFilter — JWT Authentication Filter
 *
 * HOW THE SPRING SECURITY FILTER CHAIN WORKS:
 *   Every HTTP request passes through a chain of filters before reaching
 *   your @RestController. Spring Security uses these filters to check auth.
 *
 *   We insert JwtAuthFilter BEFORE UsernamePasswordAuthenticationFilter.
 *   This means: before Spring Security tries username/password auth,
 *   we check for a JWT and, if valid, set the authentication in the SecurityContext.
 *
 * OncePerRequestFilter:
 *   Guarantees this filter runs exactly once per request (not twice on forwards).
 *
 * HOW AUTHENTICATION IS SET:
 *   SecurityContextHolder holds the authentication for the current request thread.
 *   When we call SecurityContextHolder.getContext().setAuthentication(...),
 *   Spring Security considers the request authenticated.
 *   The @PreAuthorize annotations on controllers read from this context.
 *
 * FILTER LOGIC (for every request):
 *   1. Extract "Authorization: Bearer <token>" header
 *   2. If no token → let the request proceed (SecurityConfig decides if auth is required)
 *   3. If token present but invalid → let the request proceed as unauthenticated
 *   4. If token valid → extract userId, look up user, set SecurityContext
 *
 * LESSON — Why not throw an exception on invalid token?
 *   It's the SecurityConfig's job to decide which routes require auth.
 *   The filter just answers "who is this?" — not "should they be allowed?".
 *   If we set no auth and the route requires auth, Spring Security returns 401 automatically.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = extractToken(request);

        if (StringUtils.hasText(token) && jwtUtil.validateToken(token)) {
            try {
                Long userId = jwtUtil.extractUserId(token);
                String role = jwtUtil.extractRole(token);

                // Load user from DB to verify they still exist and are enabled
                // In high-throughput systems this DB call can be skipped if token is trusted
                User user = userRepository.findById(userId).orElse(null);

                if (user != null && user.isEnabled()) {
                    // ROLE_ prefix is required by Spring Security's role mechanism
                    String authority = "ROLE_" + role;
                    UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                            user,                                          // principal
                            null,                                          // credentials (null for JWT)
                            List.of(new SimpleGrantedAuthority(authority)) // authorities
                        );

                    authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    // Set the authentication — this request is now authenticated
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                log.debug("Could not set user authentication: {}", e.getMessage());
                // Don't rethrow — just proceed as unauthenticated
            }
        }

        // Always pass the request to the next filter, authenticated or not
        filterChain.doFilter(request, response);
    }

    /**
     * Extract the token from the Authorization header.
     * Expected format: "Authorization: Bearer eyJhbGci..."
     *
     * @return The token string, or null if header is missing/malformed
     */
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);  // Remove "Bearer " prefix
        }
        return null;
    }
}
