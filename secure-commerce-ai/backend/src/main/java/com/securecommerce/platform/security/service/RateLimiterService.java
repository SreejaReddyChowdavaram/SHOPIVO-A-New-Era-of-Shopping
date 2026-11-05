package com.securecommerce.platform.security.service;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * RateLimiterService — Lightweight, thread-safe, in-memory rate limiter for authentication endpoints.
 *
 * Implements a fixed-window counter with atomic acquisition per client IP address.
 * Configured through Spring application properties with zero external dependencies (no Redis).
 */
@Slf4j
@Service
public class RateLimiterService {

    @Getter
    private final boolean enabled;

    @Getter
    private final int maxLoginAttempts;

    @Getter
    private final long loginWindowSeconds;

    @Getter
    private final int maxRegisterAttempts;

    @Getter
    private final long registerWindowSeconds;

    @Getter
    private final boolean trustedProxyEnabled;

    private final ConcurrentMap<String, RequestBucket> loginBuckets = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, RequestBucket> registerBuckets = new ConcurrentHashMap<>();

    public RateLimiterService(
            @Value("${app.rate-limit.auth.enabled:true}") boolean enabled,
            @Value("${app.rate-limit.auth.max-login-attempts:10}") int maxLoginAttempts,
            @Value("${app.rate-limit.auth.login-window-seconds:60}") long loginWindowSeconds,
            @Value("${app.rate-limit.auth.max-register-attempts:5}") int maxRegisterAttempts,
            @Value("${app.rate-limit.auth.register-window-seconds:60}") long registerWindowSeconds,
            @Value("${app.rate-limit.trusted-proxy-enabled:false}") boolean trustedProxyEnabled) {
        this.enabled = enabled;
        this.maxLoginAttempts = maxLoginAttempts;
        this.loginWindowSeconds = loginWindowSeconds;
        this.maxRegisterAttempts = maxRegisterAttempts;
        this.registerWindowSeconds = registerWindowSeconds;
        this.trustedProxyEnabled = trustedProxyEnabled;
    }

    /**
     * Checks if a client IP can proceed with a login request.
     */
    public RateLimitResult checkLoginLimit(String clientIp) {
        if (!enabled) {
            return RateLimitResult.allowed();
        }
        return checkLimit(loginBuckets, clientIp, maxLoginAttempts, loginWindowSeconds);
    }

    /**
     * Checks if a client IP can proceed with a registration request.
     */
    public RateLimitResult checkRegisterLimit(String clientIp) {
        if (!enabled) {
            return RateLimitResult.allowed();
        }
        return checkLimit(registerBuckets, clientIp, maxRegisterAttempts, registerWindowSeconds);
    }

    private RateLimitResult checkLimit(
            ConcurrentMap<String, RequestBucket> buckets,
            String clientIp,
            int maxAttempts,
            long windowSeconds) {
        long now = System.currentTimeMillis();
        long windowDurationMs = windowSeconds * 1000L;

        RequestBucket bucket = buckets.computeIfAbsent(clientIp, k -> new RequestBucket(now));
        boolean allowed = bucket.tryAcquire(maxAttempts, windowDurationMs, now);

        if (allowed) {
            return RateLimitResult.allowed();
        } else {
            long retryAfterSeconds = bucket.getRemainingWindowSeconds(windowDurationMs, now);
            return RateLimitResult.denied(retryAfterSeconds);
        }
    }

    /**
     * Periodic cleanup task every 5 minutes to purge inactive client IP buckets and bound memory usage.
     */
    @Scheduled(fixedRate = 300000)
    public void cleanupStaleBuckets() {
        long now = System.currentTimeMillis();
        long loginCutoff = now - (loginWindowSeconds * 2000L);
        long registerCutoff = now - (registerWindowSeconds * 2000L);

        int loginBefore = loginBuckets.size();
        int registerBefore = registerBuckets.size();
        loginBuckets.entrySet().removeIf(entry -> entry.getValue().getLastActivityTime() < loginCutoff);
        registerBuckets.entrySet().removeIf(entry -> entry.getValue().getLastActivityTime() < registerCutoff);
        log.info("RateLimiter cleanup executed. Active login buckets: {}, register buckets: {}",
                loginBuckets.size(), registerBuckets.size());
    }

    /**
     * Clear all buckets (useful for test isolation).
     */
    public void resetAll() {
        loginBuckets.clear();
        registerBuckets.clear();
    }

    /**
     * Testing helper: advance the window for an IP into the past to simulate time passing.
     */
    public void advanceLoginWindowForTesting(String clientIp, long milliseconds) {
        RequestBucket bucket = loginBuckets.get(clientIp);
        if (bucket != null) {
            bucket.advanceWindowIntoPast(milliseconds);
        }
    }

    /**
     * Testing helper: advance the window for an IP into the past to simulate time passing.
     */
    public void advanceRegisterWindowForTesting(String clientIp, long milliseconds) {
        RequestBucket bucket = registerBuckets.get(clientIp);
        if (bucket != null) {
            bucket.advanceWindowIntoPast(milliseconds);
        }
    }

    /**
     * Internal thread-safe request bucket for an IP address.
     */
    public static class RequestBucket {
        private int count;
        private long windowStartTime;
        private long lastActivityTime;

        public RequestBucket(long now) {
            this.count = 0;
            this.windowStartTime = now;
            this.lastActivityTime = now;
        }

        public synchronized boolean tryAcquire(int maxLimit, long windowDurationMs, long now) {
            this.lastActivityTime = now;
            if (now - windowStartTime >= windowDurationMs) {
                windowStartTime = now;
                count = 1;
                return true;
            }
            if (count < maxLimit) {
                count++;
                return true;
            }
            return false;
        }

        public synchronized long getRemainingWindowSeconds(long windowDurationMs, long now) {
            long elapsed = now - windowStartTime;
            long remainingMs = windowDurationMs - elapsed;
            return Math.max(1, (remainingMs + 999) / 1000);
        }

        public synchronized long getLastActivityTime() {
            return lastActivityTime;
        }

        // For testing purposes: advance window start time into the past
        public synchronized void advanceWindowIntoPast(long milliseconds) {
            this.windowStartTime -= milliseconds;
        }
    }

    /**
     * Result of a rate-limit check.
     */
    @Getter
    public static class RateLimitResult {
        private final boolean allowed;
        private final long retryAfterSeconds;

        private RateLimitResult(boolean allowed, long retryAfterSeconds) {
            this.allowed = allowed;
            this.retryAfterSeconds = retryAfterSeconds;
        }

        public static RateLimitResult allowed() {
            return new RateLimitResult(true, 0);
        }

        public static RateLimitResult denied(long retryAfterSeconds) {
            return new RateLimitResult(false, retryAfterSeconds);
        }
    }
}
