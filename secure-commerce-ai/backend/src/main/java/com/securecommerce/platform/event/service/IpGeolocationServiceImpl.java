package com.securecommerce.platform.event.service;

import com.securecommerce.platform.event.dto.GeoLocation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * IpGeolocationServiceImpl — Approximate IP Geolocation Provider with Caching & Resilience.
 *
 * Guarantees:
 * - Approximate city/state/country resolution only (no GPS).
 * - Thread-safe in-memory cache to avoid duplicate lookups.
 * - Strict 1.5-second timeout — external failure NEVER blocks login.
 * - Detects loopback and private networks as LOCAL_DEV.
 */
@Slf4j
@Service
public class IpGeolocationServiceImpl implements IpGeolocationService {

    private final Map<String, GeoLocation> cache = new ConcurrentHashMap<>();

    @Value("${app.geolocation.enabled:true}")
    private boolean enabled;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(1200))
            .build();

    private static final Pattern COUNTRY_PATTERN = Pattern.compile("\"country_name\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern REGION_PATTERN = Pattern.compile("\"region\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern CITY_PATTERN = Pattern.compile("\"city\"\\s*:\\s*\"([^\"]+)\"");

    @Override
    public GeoLocation resolveLocation(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return GeoLocation.unavailable();
        }

        String ip = ipAddress.trim();

        // Check local development loopback / private ranges
        if (isLocalOrPrivateIp(ip)) {
            return GeoLocation.localDev();
        }

        if (!enabled) {
            return GeoLocation.unavailable();
        }

        // Check cache
        if (cache.containsKey(ip)) {
            return cache.get(ip);
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://ipapi.co/" + ip + "/json/"))
                    .header("User-Agent", "SHOPIVO-Platform/1.0")
                    .timeout(Duration.ofMillis(1500))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 && response.body() != null) {
                String body = response.body();
                String country = extractMatch(COUNTRY_PATTERN, body, "Unknown");
                String state = extractMatch(REGION_PATTERN, body, "Unknown");
                String city = extractMatch(CITY_PATTERN, body, "Unknown");

                GeoLocation location = GeoLocation.builder()
                        .country(country)
                        .stateRegion(state)
                        .city(city)
                        .status("RESOLVED")
                        .build();

                // Limit cache size to 5,000 items
                if (cache.size() < 5000) {
                    cache.put(ip, location);
                }
                return location;
            }
        } catch (Exception e) {
            log.debug("Approximate geolocation lookup skipped for IP {}: {}", ip, e.getMessage());
        }

        GeoLocation fallback = GeoLocation.unavailable();
        cache.put(ip, fallback);
        return fallback;
    }

    private boolean isLocalOrPrivateIp(String ip) {
        return ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1") || ip.equalsIgnoreCase("localhost")
                || ip.startsWith("10.") || ip.startsWith("192.168.")
                || (ip.startsWith("172.") && isPrivate172(ip));
    }

    private boolean isPrivate172(String ip) {
        try {
            String[] parts = ip.split("\\.");
            if (parts.length >= 2) {
                int second = Integer.parseInt(parts[1]);
                return second >= 16 && second <= 31;
            }
        } catch (Exception ignored) {}
        return false;
    }

    private String extractMatch(Pattern pattern, String text, String defaultVal) {
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return defaultVal;
    }
}

