package com.securecommerce.platform;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * PlatformApplicationTests — Spring Context Load Test
 *
 * WHY THIS TEST EXISTS:
 *   This is the most fundamental test in a Spring Boot project.
 *   It verifies that the Spring application context loads successfully —
 *   meaning all @Bean definitions, @Component classes, @Configuration
 *   files, and auto-configurations are valid and can be wired together.
 *
 *   If this test fails, the application cannot start at all.
 *   Common causes: circular dependencies, missing @Bean, misconfigured properties.
 *
 * @SpringBootTest:
 *   Loads the full Spring application context for testing.
 *   This is a heavy test (takes several seconds) but gives maximum confidence.
 *
 * @ActiveProfiles("test"):
 *   Activates application-test.yml which uses H2 in-memory database.
 *   This test therefore does NOT require PostgreSQL to be running.
 *   It is safe to run on any machine, including CI/CD pipelines.
 *
 * LESSON — Test naming:
 *   The method name contextLoads() follows the convention of describing
 *   what the test asserts. An empty test body is valid here — if the
 *   context fails to load, Spring throws an exception before the method
 *   body even runs, causing the test to fail automatically.
 */
@SpringBootTest
@ActiveProfiles("test")
class PlatformApplicationTests {

    @Test
    void contextLoads() {
        // If the Spring context starts without throwing an exception,
        // this test passes. The empty body is intentional.
    }
}
