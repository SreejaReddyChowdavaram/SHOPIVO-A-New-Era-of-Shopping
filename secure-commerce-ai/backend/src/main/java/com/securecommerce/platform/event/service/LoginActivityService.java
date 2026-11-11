package com.securecommerce.platform.event.service;

import com.securecommerce.platform.event.context.EventContextResolver;
import com.securecommerce.platform.event.dto.GeoLocation;
import com.securecommerce.platform.event.entity.UserLoginEvent;
import com.securecommerce.platform.event.repository.UserLoginEventRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * LoginActivityService — Core business logic for recording and querying authentication telemetry.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginActivityService {

    private final UserLoginEventRepository loginEventRepository;
    private final UserRepository userRepository;
    private final EventContextResolver contextResolver;
    private final IpGeolocationService geolocationService;

    /**
     * Record a successful authentication event.
     * Updates account-level login count, last login timestamp, IP, and location.
     */
    @Transactional
    public UserLoginEvent recordLoginSuccess(User user, String authMethod) {
        var context = contextResolver.resolveContext();
        String ipAddress = context != null && context.ipAddress() != null ? context.ipAddress() : "127.0.0.1";
        String userAgent = context != null ? context.userAgent() : null;

        GeoLocation geo = geolocationService.resolveLocation(ipAddress);
        String ipVersion = (ipAddress != null && ipAddress.contains(":")) ? "IPV6" : "IPV4";

        UserAgentParsed ua = parseUserAgent(userAgent);

        UserLoginEvent event = UserLoginEvent.builder()
                .userId(user.getId())
                .userEmail(user.getEmail())
                .userRole(user.getRole().name())
                .authMethod(authMethod)
                .loginTimestamp(Instant.now())
                .ipAddress(ipAddress)
                .ipVersion(ipVersion)
                .country(geo.getCountry())
                .stateRegion(geo.getStateRegion())
                .city(geo.getCity())
                .locationStatus(geo.getStatus())
                .browser(ua.browser)
                .operatingSystem(ua.os)
                .deviceType(ua.deviceType)
                .loginResult("SUCCESS")
                .failureReason(null)
                .build();

        UserLoginEvent saved = loginEventRepository.save(event);

        // Update persistent user metrics
        user.setLoginCount(user.getLoginCount() + 1);
        user.setLastLoginAt(Instant.now());
        user.setLastLoginIp(ipAddress);
        user.setLastLoginLocation(formatLocation(geo));
        userRepository.save(user);

        log.info("Recorded LOGIN_SUCCESS for user id={}, count={}, ip={}", user.getId(), user.getLoginCount(), ipAddress);
        return saved;
    }

    /**
     * Record a failed authentication attempt.
     * Never increments successful login count.
     */
    @Transactional
    public UserLoginEvent recordLoginFailure(String email, String role, String authMethod, String failureReason, Long userId) {
        var context = contextResolver.resolveContext();
        String ipAddress = context != null && context.ipAddress() != null ? context.ipAddress() : "127.0.0.1";
        String userAgent = context != null ? context.userAgent() : null;

        GeoLocation geo = geolocationService.resolveLocation(ipAddress);
        String ipVersion = (ipAddress != null && ipAddress.contains(":")) ? "IPV6" : "IPV4";

        UserAgentParsed ua = parseUserAgent(userAgent);

        UserLoginEvent event = UserLoginEvent.builder()
                .userId(userId)
                .userEmail(email != null ? email.trim().toLowerCase() : "unknown@attempt")
                .userRole(role)
                .authMethod(authMethod)
                .loginTimestamp(Instant.now())
                .ipAddress(ipAddress)
                .ipVersion(ipVersion)
                .country(geo.getCountry())
                .stateRegion(geo.getStateRegion())
                .city(geo.getCity())
                .locationStatus(geo.getStatus())
                .browser(ua.browser)
                .operatingSystem(ua.os)
                .deviceType(ua.deviceType)
                .loginResult("FAILED")
                .failureReason(failureReason)
                .build();

        UserLoginEvent saved = loginEventRepository.save(event);
        log.warn("Recorded LOGIN_FAILURE for email={}, reason={}, ip={}", email, failureReason, ipAddress);
        return saved;
    }

    /**
     * Retrieve personal login history for the authenticated user.
     */
    @Transactional(readOnly = true)
    public List<UserLoginEvent> getRecentLoginHistory(Long userId) {
        return loginEventRepository.findTop20ByUserIdOrderByLoginTimestampDesc(userId);
    }

    /**
     * Admin query with multi-attribute filtering and pagination.
     */
    @Transactional(readOnly = true)
    public Page<UserLoginEvent> getAdminLoginEvents(
            String role,
            String result,
            String authMethod,
            String search,
            Pageable pageable
    ) {
        Specification<UserLoginEvent> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();

            if (role != null && !role.isBlank() && !role.equalsIgnoreCase("ALL")) {
                predicates = cb.and(predicates, cb.equal(root.get("userRole"), role.toUpperCase()));
            }

            if (result != null && !result.isBlank() && !result.equalsIgnoreCase("ALL")) {
                predicates = cb.and(predicates, cb.equal(root.get("loginResult"), result.toUpperCase()));
            }

            if (authMethod != null && !authMethod.isBlank() && !authMethod.equalsIgnoreCase("ALL")) {
                predicates = cb.and(predicates, cb.equal(root.get("authMethod"), authMethod.toUpperCase()));
            }

            if (search != null && !search.isBlank()) {
                String term = "%" + search.toLowerCase().trim() + "%";
                var emailLike = cb.like(cb.lower(root.get("userEmail")), term);
                var ipLike = cb.like(root.get("ipAddress"), term);
                var cityLike = cb.like(cb.lower(root.get("city")), term);
                predicates = cb.and(predicates, cb.or(emailLike, ipLike, cityLike));
            }

            return predicates;
        };

        return loginEventRepository.findAll(spec, pageable);
    }

    /**
     * Summary stats for Admin dashboard.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getLoginStatistics() {
        long totalSuccess = loginEventRepository.countByLoginResult("SUCCESS");
        long totalFailed = loginEventRepository.countByLoginResult("FAILED");
        long totalUsers = userRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSuccessLogins", totalSuccess);
        stats.put("totalFailedLogins", totalFailed);
        stats.put("totalUsers", totalUsers);
        stats.put("loginSuccessRate", (totalSuccess + totalFailed > 0)
                ? Math.round(((double) totalSuccess / (totalSuccess + totalFailed)) * 100) : 100);

        return stats;
    }

    /**
     * Data retention cleanup for old login audit records.
     */
    @Transactional
    public int cleanupOldLoginEvents(int retentionDays) {
        Instant cutoff = Instant.now().minus(java.time.Duration.ofDays(retentionDays));
        int deleted = loginEventRepository.deleteOldEvents(cutoff);
        log.info("Cleaned up {} login events older than {} days (cutoff: {})", deleted, retentionDays, cutoff);
        return deleted;
    }

    private String formatLocation(GeoLocation geo) {
        if ("LOCAL_DEV".equals(geo.getStatus())) {
            return "Local Development (127.0.0.1)";
        }
        if ("RESOLVED".equals(geo.getStatus())) {
            return geo.getCity() + ", " + geo.getCountry();
        }
        return "Location Unavailable";
    }

    private UserAgentParsed parseUserAgent(String ua) {
        if (ua == null || ua.isBlank()) {
            return new UserAgentParsed("Unknown", "Unknown", "DESKTOP");
        }

        String lower = ua.toLowerCase();
        String browser = "Other";
        if (lower.contains("edg/")) browser = "Microsoft Edge";
        else if (lower.contains("chrome/") && !lower.contains("chromium")) browser = "Google Chrome";
        else if (lower.contains("firefox/")) browser = "Mozilla Firefox";
        else if (lower.contains("safari/") && !lower.contains("chrome")) browser = "Apple Safari";

        String os = "Other";
        if (lower.contains("windows nt 10")) os = "Windows 10/11";
        else if (lower.contains("windows")) os = "Windows";
        else if (lower.contains("iphone") || lower.contains("ipad")) os = "iOS";
        else if (lower.contains("mac os x")) os = "macOS";
        else if (lower.contains("android")) os = "Android";
        else if (lower.contains("linux")) os = "Linux";

        String device = "DESKTOP";
        if (lower.contains("mobile") || lower.contains("android") || lower.contains("iphone")) {
            device = "MOBILE";
        } else if (lower.contains("ipad") || lower.contains("tablet")) {
            device = "TABLET";
        }

        return new UserAgentParsed(browser, os, device);
    }

    private record UserAgentParsed(String browser, String os, String deviceType) {}
}
