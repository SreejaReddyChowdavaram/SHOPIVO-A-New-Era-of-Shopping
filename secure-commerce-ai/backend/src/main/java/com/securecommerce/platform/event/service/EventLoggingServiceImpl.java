package com.securecommerce.platform.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.securecommerce.platform.event.context.EventContext;
import com.securecommerce.platform.event.context.EventContextResolver;
import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.entity.UserEvent;
import com.securecommerce.platform.event.repository.UserEventRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * EventLoggingServiceImpl — Resilient implementation of EventLoggingService.
 *
 * Guarantees:
 * 1. Transactional isolation: Uses Propagation.REQUIRES_NEW so event persistence
 *    runs in its own independent database transaction.
 * 2. Non-blocking failure safety: Database errors during event logging are trapped
 *    and logged without aborting caller business flows.
 * 3. Strict privacy filtering: Credentials, CVV, OTP, JWT, and raw secrets are sanitized.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EventLoggingServiceImpl implements EventLoggingService {

    private final UserEventRepository userEventRepository;
    private final EventContextResolver eventContextResolver;
    private final ObjectMapper objectMapper;

    private static final Pattern SENSITIVE_KEY_PATTERN = Pattern.compile(
            "(?i).*(password|secret|token|cvv|card|pan|otp|pin|authorization|credential).*"
    );

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UserEvent logEvent(EventType eventType, Long userId, String referenceType, String referenceId, Map<String, Object> metadata) {
        EventContext context = eventContextResolver.resolveContext();
        String userEmail = extractEmailFromMetadata(metadata);
        return doLogEvent(eventType, userId, userEmail, referenceType, referenceId, context.sessionId(), context.ipAddress(), context.userAgent(), metadata);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UserEvent logEvent(EventType eventType, User user, String referenceType, String referenceId, Map<String, Object> metadata) {
        EventContext context = eventContextResolver.resolveContext();
        Long userId = user != null ? user.getId() : null;
        String userEmail = user != null ? user.getEmail() : extractEmailFromMetadata(metadata);
        return doLogEvent(eventType, userId, userEmail, referenceType, referenceId, context.sessionId(), context.ipAddress(), context.userAgent(), metadata);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UserEvent logEvent(EventType eventType, Long userId, Map<String, Object> metadata) {
        return logEvent(eventType, userId, null, null, metadata);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UserEvent logEvent(EventType eventType, Map<String, Object> metadata) {
        return logEvent(eventType, (Long) null, null, null, metadata);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UserEvent logEventWithExplicitContext(
            EventType eventType,
            Long userId,
            String referenceType,
            String referenceId,
            String sessionId,
            String ipAddress,
            String userAgent,
            Map<String, Object> metadata
    ) {
        String userEmail = extractEmailFromMetadata(metadata);
        return doLogEvent(eventType, userId, userEmail, referenceType, referenceId, sessionId, ipAddress, userAgent, metadata);
    }

    private UserEvent doLogEvent(
            EventType eventType,
            Long userId,
            String userEmail,
            String referenceType,
            String referenceId,
            String sessionId,
            String ipAddress,
            String userAgent,
            Map<String, Object> metadata
    ) {
        try {
            String serializedMetadata = serializeMetadata(metadata);

            UserEvent event = UserEvent.builder()
                    .userId(userId)
                    .userEmail(userEmail)
                    .eventType(eventType)
                    .eventTimestamp(Instant.now())
                    .sessionId(sessionId)
                    .referenceType(referenceType)
                    .referenceId(referenceId)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .metadata(serializedMetadata)
                    .build();

            UserEvent saved = userEventRepository.save(event);
            log.debug("UserEvent recorded: id={}, type={}, userId={}, ref={}:{}",
                    saved.getId(), eventType, userId, referenceType, referenceId);
            return saved;
        } catch (Exception e) {
            log.error("Failed to persist user event [type={}, userId={}]: {}", eventType, userId, e.getMessage(), e);
            // Non-blocking: never crash calling flow because of an event log error
            return null;
        }
    }

    private String extractEmailFromMetadata(Map<String, Object> metadata) {
        if (metadata == null) return null;
        Object email = metadata.get("email");
        if (email == null) {
            email = metadata.get("attemptedEmail");
        }
        return email != null ? String.valueOf(email) : null;
    }

    private String serializeMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }

        try {
            Map<String, Object> sanitized = new HashMap<>();
            for (Map.Entry<String, Object> entry : metadata.entrySet()) {
                String key = entry.getKey();
                if (key != null && SENSITIVE_KEY_PATTERN.matcher(key).matches()) {
                    sanitized.put(key, "[REDACTED]");
                } else {
                    sanitized.put(key, entry.getValue());
                }
            }
            return objectMapper.writeValueAsString(sanitized);
        } catch (Exception e) {
            log.warn("Failed to serialize event metadata: {}", e.getMessage());
            return "{\"serialization_error\":\"true\"}";
        }
    }
}
