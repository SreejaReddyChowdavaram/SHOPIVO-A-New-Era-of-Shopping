package com.securecommerce.platform.common;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * HomeController — Root endpoint for health and server status check via browser.
 */
@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "application", "SecureCommerce AI Platform",
                "message", "Backend REST API is operational",
                "health", "/api/actuator/health",
                "publicProducts", "/api/products"
        ));
    }
}
