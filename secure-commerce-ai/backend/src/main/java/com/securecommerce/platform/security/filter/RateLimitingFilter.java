package com.securecommerce.platform.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.security.service.RateLimiterService;
import com.securecommerce.platform.security.service.RateLimiterService.RateLimitResult;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

/**
 * RateLimitingFilter — HTTP filter enforcing rate limits on authentication endpoints.
 *
 * Runs before authentication processing. Only POST /api/auth/login and POST /api/auth/register
 * are evaluated. All other endpoints pass through immediately.
 *
 * Untrusted forwarded headers (X-Forwarded-For) are ignored by default to prevent spoofing,
 * unless trusted proxy support is explicitly enabled via configuration.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (!rateLimiterService.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String method = request.getMethod();

        if ("POST".equalsIgnoreCase(method) && path != null) {
            if (isAuthEndpoint(path, "/auth/login")) {
                String clientIp = resolveClientIp(request);
                RateLimitResult result = rateLimiterService.checkLoginLimit(clientIp);
                if (!result.isAllowed()) {
                    handleRateLimitExceeded(response, clientIp, "login", result.getRetryAfterSeconds());
                    return;
                }
            } else if (isAuthEndpoint(path, "/auth/register")) {
                String clientIp = resolveClientIp(request);
                RateLimitResult result = rateLimiterService.checkRegisterLimit(clientIp);
                if (!result.isAllowed()) {
                    handleRateLimitExceeded(response, clientIp, "register", result.getRetryAfterSeconds());
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAuthEndpoint(String path, String authPath) {
        String normalized = (path.endsWith("/") && path.length() > 1) ? path.substring(0, path.length() - 1) : path;
        return normalized.equals(authPath) || normalized.equals("/api" + authPath);
    }

    private void handleRateLimitExceeded(
            HttpServletResponse response,
            String clientIp,
            String endpointName,
            long retryAfterSeconds
    ) throws IOException {
        log.warn("Rate limit exceeded for client IP [{}] on [{}] endpoint. Retry-After: {}s",
                clientIp, endpointName, retryAfterSeconds);

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value()); // HTTP 429
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));

        String errorMessage = String.format(
                "Too many %s attempts. Rate limit exceeded. Please wait %d seconds before retrying.",
                endpointName, retryAfterSeconds
        );

        ApiResponse<Void> apiResponse = ApiResponse.error(
                errorMessage,
                Map.of(
                        "code", "RATE_LIMIT_EXCEEDED",
                        "retryAfterSeconds", retryAfterSeconds,
                        "endpoint", endpointName
                )
        );

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
        response.getWriter().flush();
    }

    /**
     * Resolves client IP safely. Avoids trusting spoofable headers unless trusted proxy mode is enabled.
     */
    public String resolveClientIp(HttpServletRequest request) {
        if (rateLimiterService.isTrustedProxyEnabled()) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (StringUtils.hasText(xForwardedFor)) {
                String clientIp = xForwardedFor.split(",")[0].trim();
                if (clientIp.matches("^[0-9a-fA-F:.]+$")) {
                    return clientIp;
                }
            }
            String xRealIp = request.getHeader("X-Real-IP");
            if (StringUtils.hasText(xRealIp) && xRealIp.trim().matches("^[0-9a-fA-F:.]+$")) {
                return xRealIp.trim();
            }
        }
        String remoteAddr = request.getRemoteAddr();
        return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr : "unknown";
    }
}
