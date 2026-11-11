package com.securecommerce.platform.event.context;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EventContextResolverTest {

    private EventContextResolver resolver;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @BeforeEach
    void setUp() {
        resolver = new EventContextResolver();
        ServletRequestAttributes attrs = new ServletRequestAttributes(request, response);
        RequestContextHolder.setRequestAttributes(attrs);
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    @DisplayName("Untrusted proxy mode uses remoteAddr directly")
    void untrustedProxy_UsesRemoteAddr() {
        resolver.setTrustedProxyEnabled(false);
        when(request.getRemoteAddr()).thenReturn("192.168.1.100");

        EventContext context = resolver.resolveContext();
        assertThat(context.ipAddress()).isEqualTo("192.168.1.100");
    }

    @Test
    @DisplayName("Trusted proxy extracts single public IPv4 without spoofing")
    void trustedProxy_SinglePublicIpv4() {
        resolver.setTrustedProxyEnabled(true);
        when(request.getHeader("X-Forwarded-For")).thenReturn("103.21.244.2");

        EventContext context = resolver.resolveContext();
        assertThat(context.ipAddress()).isEqualTo("103.21.244.2");
    }

    @Test
    @DisplayName("Trusted proxy defeats spoofed header by taking rightmost non-internal IP")
    void trustedProxy_DefeatsSpoofedHeader() {
        resolver.setTrustedProxyEnabled(true);
        // Attacker sent 8.8.8.8, Render proxy appended real client IP (106.51.72.100), then internal balancer (10.0.1.5)
        when(request.getHeader("X-Forwarded-For")).thenReturn("8.8.8.8, 106.51.72.100, 10.0.1.5");

        EventContext context = resolver.resolveContext();
        assertThat(context.ipAddress()).isEqualTo("106.51.72.100");
    }

    @Test
    @DisplayName("Trusted proxy handles IPv4 with port")
    void trustedProxy_Ipv4WithPort() {
        resolver.setTrustedProxyEnabled(true);
        when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.195:44321");

        EventContext context = resolver.resolveContext();
        assertThat(context.ipAddress()).isEqualTo("203.0.113.195");
    }

    @Test
    @DisplayName("Trusted proxy handles raw IPv6 address")
    void trustedProxy_RawIpv6() {
        resolver.setTrustedProxyEnabled(true);
        when(request.getHeader("X-Forwarded-For")).thenReturn("2001:0db8:85a3:0000:0000:8a2e:0370:7334");

        EventContext context = resolver.resolveContext();
        assertThat(context.ipAddress()).isEqualTo("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    }

    @Test
    @DisplayName("Trusted proxy handles bracketed IPv6 with port")
    void trustedProxy_BracketedIpv6WithPort() {
        resolver.setTrustedProxyEnabled(true);
        when(request.getHeader("X-Forwarded-For")).thenReturn("[2001:db8::1]:8080");

        EventContext context = resolver.resolveContext();
        assertThat(context.ipAddress()).isEqualTo("2001:db8::1");
    }

    @Test
    @DisplayName("Trusted proxy handles private IP only chain by falling back safely")
    void trustedProxy_AllPrivateIps() {
        resolver.setTrustedProxyEnabled(true);
        when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.5, 10.0.0.1");

        EventContext context = resolver.resolveContext();
        assertThat(context.ipAddress()).isEqualTo("192.168.1.5");
    }

    @Test
    @DisplayName("Outside HTTP scope returns empty context with fallback 127.0.0.1")
    void outsideHttpScope_ReturnsDefault() {
        RequestContextHolder.resetRequestAttributes();

        EventContext context = resolver.resolveContext();
        assertThat(context.ipAddress()).isEqualTo("127.0.0.1");
        assertThat(context.userAgent()).isEqualTo("system-internal");
    }
}
