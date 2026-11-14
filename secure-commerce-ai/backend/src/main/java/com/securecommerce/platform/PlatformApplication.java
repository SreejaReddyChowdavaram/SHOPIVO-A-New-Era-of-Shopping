package com.securecommerce.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * PlatformApplication — Spring Boot Entry Point
 */
@SpringBootApplication
@EnableScheduling
public class PlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlatformApplication.class, args);
    }

    @org.springframework.beans.factory.annotation.Value("${server.port:8080}")
    private String serverPort;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        System.out.println("\n" +
                "===========================================================\n" +
                "  SecureCommerce Backend is RUNNING\n" +
                "  -> API Base URL:  http://localhost:" + serverPort + "/api\n" +
                "  -> Health Check:  http://localhost:" + serverPort + "/api/actuator/health\n" +
                "  -> Frontend App:  http://localhost:5173\n" +
                "===========================================================\n");
    }
}
