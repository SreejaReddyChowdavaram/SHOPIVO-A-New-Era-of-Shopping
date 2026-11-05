package com.securecommerce.platform.event.context;

/**
 * EventContext — Encapsulates request-level network and session context.
 *
 * Captures privacy-conscious network address, user agent, and correlation session ID.
 */
public record EventContext(
        String sessionId,
        String ipAddress,
        String userAgent
) {
    public static EventContext empty() {
        return new EventContext(null, "127.0.0.1", "system-internal");
    }
}
