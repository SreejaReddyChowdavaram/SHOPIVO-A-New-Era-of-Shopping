package com.securecommerce.platform.event.context;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;
import java.util.regex.Pattern;

/**
 * EventContextResolver — Safely extracts request-level device, IP, and session correlation.
 *
 * Privacy decisions:
 * - Session ID: Generates a cryptographically random correlation identifier or reuses
 *   the client-provided 'X-Session-Id' header.
 * - IP Address: Extracts client IP safely from reverse-proxy headers (X-Forwarded-For)
 *   or fallback remoteAddr. Truncates length to 45 chars (IPv6 max).
 * - User-Agent: Sanitized and capped at 500 characters.
 * - Does NOT perform invasive device fingerprinting.
 * - Safely degrades when called outside HTTP request scope (e.g. background tasks or unit tests).
 */
@Slf4j
@Component
public class EventContextResolver {

    public static final String SESSION_HEADER = "X-Session-Id";
    public static final String SESSION_ATTR = "sc_session_id_attr";
    private static final Pattern SAFE_SESSION_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{8,100}$");

    public EventContext resolveContext() {
        ServletRequestAttributes attrs;
        try {
            attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        } catch (Exception e) {
            attrs = null;
        }

        if (attrs == null || attrs.getRequest() == null) {
            return EventContext.empty();
        }

        HttpServletRequest request = attrs.getRequest();
        HttpServletResponse response = attrs.getResponse();

        // 1. Session ID extraction or generation
        String sessionId = request.getHeader(SESSION_HEADER);
        if (sessionId != null && !SAFE_SESSION_PATTERN.matcher(sessionId.trim()).matches()) {
            // Malformed session ID — disregard and generate clean
            sessionId = null;
        }

        if (sessionId == null || sessionId.isBlank()) {
            sessionId = (String) request.getAttribute(SESSION_ATTR);
        }

        if (sessionId == null || sessionId.isBlank()) {
            sessionId = "sess_" + UUID.randomUUID().toString().replace("-", "");
            request.setAttribute(SESSION_ATTR, sessionId);
        }

        if (response != null && !response.containsHeader(SESSION_HEADER)) {
            response.setHeader(SESSION_HEADER, sessionId);
        }

        // 2. IP Address
        String ipAddress = extractClientIp(request);

        // 3. User-Agent
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null) {
            userAgent = userAgent.trim();
            if (userAgent.length() > 500) {
                userAgent = userAgent.substring(0, 500);
            }
        }

        return new EventContext(sessionId, ipAddress, userAgent);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String firstIp = xForwardedFor.split(",")[0].trim();
            return sanitizeIp(firstIp);
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return sanitizeIp(realIp.trim());
        }

        return sanitizeIp(request.getRemoteAddr());
    }

    private String sanitizeIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return "127.0.0.1";
        }
        ip = ip.trim();
        if (ip.length() > 45) {
            ip = ip.substring(0, 45);
        }
        return ip;
    }
}
