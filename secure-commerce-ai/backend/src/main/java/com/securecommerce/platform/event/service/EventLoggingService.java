package com.securecommerce.platform.event.service;

import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.entity.UserEvent;
import com.securecommerce.platform.user.entity.User;

import java.util.Map;

/**
 * EventLoggingService — Reusable service contract for persisting research events.
 *
 * Controllers and business services call this service to record interactions.
 * Failures in event logging are handled gracefully and will not corrupt core transactions.
 */
public interface EventLoggingService {

    UserEvent logEvent(EventType eventType, Long userId, String referenceType, String referenceId, Map<String, Object> metadata);

    UserEvent logEvent(EventType eventType, User user, String referenceType, String referenceId, Map<String, Object> metadata);

    UserEvent logEvent(EventType eventType, Long userId, Map<String, Object> metadata);

    UserEvent logEvent(EventType eventType, Map<String, Object> metadata);

    UserEvent logEventWithExplicitContext(
            EventType eventType,
            Long userId,
            String referenceType,
            String referenceId,
            String sessionId,
            String ipAddress,
            String userAgent,
            Map<String, Object> metadata
    );
}
