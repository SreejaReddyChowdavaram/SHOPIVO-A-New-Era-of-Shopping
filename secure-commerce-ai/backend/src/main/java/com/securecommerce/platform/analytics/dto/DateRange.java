package com.securecommerce.platform.analytics.dto;

import java.time.Instant;

/**
 * Encapsulates an inclusive start and end time window in UTC for analytics querying.
 */
public record DateRange(Instant start, Instant end, String label) {

    public static DateRange of(Instant start, Instant end, String label) {
        return new DateRange(start, end, label);
    }
}

