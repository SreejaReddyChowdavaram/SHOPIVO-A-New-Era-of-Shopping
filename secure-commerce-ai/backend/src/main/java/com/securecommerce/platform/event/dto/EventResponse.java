package com.securecommerce.platform.event.dto;

import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.entity.UserEvent;

import java.time.Instant;

/**
 * EventResponse — Data transfer representation of a persisted event.
 */
public record EventResponse(
        Long id,
        Long userId,
        String userEmail,
        EventType eventType,
        Instant eventTimestamp,
        String sessionId,
        String referenceType,
        String referenceId,
        String ipAddress,
        String userAgent,
        String metadata
) {
    public static EventResponse from(UserEvent event) {
        if (event == null) return null;
        return new EventResponse(
                event.getId(),
                event.getUserId(),
                event.getUserEmail(),
                event.getEventType(),
                event.getEventTimestamp(),
                event.getSessionId(),
                event.getReferenceType(),
                event.getReferenceId(),
                event.getIpAddress(),
                event.getUserAgent(),
                event.getMetadata()
        );
    }
}
