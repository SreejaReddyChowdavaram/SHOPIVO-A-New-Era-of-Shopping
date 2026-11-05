package com.securecommerce.platform.analytics.dto;

import java.time.*;
import java.time.format.DateTimeParseException;

/**
 * Resolves standard dashboard date range filters into UTC Instants for database parameter binding.
 */
public final class DateRangeResolver {

    private DateRangeResolver() {}

    public static DateRange resolve(String range, String customStart, String customEnd) {
        Instant now = Instant.now();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        if ("custom".equalsIgnoreCase(range) && customStart != null && !customStart.isBlank()) {
            try {
                Instant start = parseStart(customStart);
                Instant end = (customEnd != null && !customEnd.isBlank()) ? parseEnd(customEnd) : now;
                return DateRange.of(start, end, "Custom Range");
            } catch (DateTimeParseException ignored) {
                // fallback to 30d on malformed custom input
            }
        }

        String normalized = (range == null || range.isBlank()) ? "all" : range.trim().toLowerCase();

        return switch (normalized) {
            case "today" -> DateRange.of(
                    today.atStartOfDay(ZoneOffset.UTC).toInstant(),
                    now,
                    "Today"
            );
            case "7d", "last_7_days" -> DateRange.of(
                    today.minusDays(6).atStartOfDay(ZoneOffset.UTC).toInstant(),
                    now,
                    "Last 7 Days"
            );
            case "30d", "last_30_days" -> DateRange.of(
                    today.minusDays(29).atStartOfDay(ZoneOffset.UTC).toInstant(),
                    now,
                    "Last 30 Days"
            );
            case "this_month" -> DateRange.of(
                    today.withDayOfMonth(1).atStartOfDay(ZoneOffset.UTC).toInstant(),
                    now,
                    "This Month"
            );
            case "last_month" -> {
                YearMonth prev = YearMonth.from(today).minusMonths(1);
                yield DateRange.of(
                        prev.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant(),
                        prev.atEndOfMonth().atTime(23, 59, 59, 999_000_000).toInstant(ZoneOffset.UTC),
                        "Last Month"
                );
            }
            case "this_year" -> DateRange.of(
                    LocalDate.of(today.getYear(), 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant(),
                    now,
                    "This Year"
            );
            case "all", "all_time" -> DateRange.of(
                    Instant.EPOCH,
                    now,
                    "All Time"
            );
            default -> DateRange.of(
                    today.minusDays(29).atStartOfDay(ZoneOffset.UTC).toInstant(),
                    now,
                    "Last 30 Days"
            );
        };
    }

    private static Instant parseStart(String str) {
        if (str.length() == 10) { // YYYY-MM-DD
            return LocalDate.parse(str).atStartOfDay(ZoneOffset.UTC).toInstant();
        }
        return Instant.parse(str);
    }

    private static Instant parseEnd(String str) {
        if (str.length() == 10) { // YYYY-MM-DD
            return LocalDate.parse(str).atTime(23, 59, 59, 999_000_000).toInstant(ZoneOffset.UTC);
        }
        return Instant.parse(str);
    }
}

