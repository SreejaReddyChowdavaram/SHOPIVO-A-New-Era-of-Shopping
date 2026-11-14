package com.securecommerce.platform.config;

import com.securecommerce.platform.product.service.ProductImageStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.boot.context.event.ApplicationStartingEvent;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

/**
 * StartupTimingListener — Comprehensive Startup Diagnostics & Lifecycle Orchestrator
 *
 * Measures and logs the exact elapsed time for each Spring Boot startup milestone:
 * 1. Application starting
 * 2. Environment prepared (profiles active)
 * 3. ApplicationContext refreshed (JPA EntityManagerFactory & Flyway completed)
 * 4. Embedded Tomcat started & listening on its TCP port
 * 5. Application ready (fully accepting incoming HTTP requests)
 * 6. Triggers non-blocking asynchronous catalog image seeding post-startup
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StartupTimingListener {

    private static final AtomicLong START_TIME = new AtomicLong(System.currentTimeMillis());

    private final ProductImageStorageService productImageStorageService;

    @EventListener(ContextRefreshedEvent.class)
    public void onContextRefreshed(ContextRefreshedEvent event) {
        long elapsed = System.currentTimeMillis() - START_TIME.get();
        log.info("[STARTUP-DIAGNOSTICS] Spring ApplicationContext refreshed (Flyway, JPA & Beans initialized) in {} ms", elapsed);
    }

    @EventListener(WebServerInitializedEvent.class)
    public void onWebServerInitialized(WebServerInitializedEvent event) {
        long elapsed = System.currentTimeMillis() - START_TIME.get();
        int port = event.getWebServer().getPort();
        log.info("[STARTUP-DIAGNOSTICS] Embedded Tomcat server initialized and LISTENING on port {} in {} ms. TCP port is OPEN.", port, elapsed);
    }

    @EventListener(ApplicationStartedEvent.class)
    public void onApplicationStarted(ApplicationStartedEvent event) {
        long elapsed = System.currentTimeMillis() - START_TIME.get();
        log.info("[STARTUP-DIAGNOSTICS] Application started successfully in {} ms.", elapsed);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady(ApplicationReadyEvent event) {
        long elapsed = System.currentTimeMillis() - START_TIME.get();
        log.info("[STARTUP-DIAGNOSTICS] SHOPIVO Platform is fully READY to accept incoming traffic (total startup: {} ms).", elapsed);

        // Trigger non-blocking asynchronous catalog image seeding in the background
        productImageStorageService.initializeSeedImagesAsync();
    }
}
