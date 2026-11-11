package com.securecommerce.platform.event.service;

import com.securecommerce.platform.event.context.EventContext;
import com.securecommerce.platform.event.context.EventContextResolver;
import com.securecommerce.platform.event.dto.GeoLocation;
import com.securecommerce.platform.event.entity.UserLoginEvent;
import com.securecommerce.platform.event.repository.UserLoginEventRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoginActivityServiceTest {

    @Mock
    private UserLoginEventRepository loginEventRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EventContextResolver contextResolver;

    @Mock
    private IpGeolocationService geolocationService;

    @InjectMocks
    private LoginActivityService loginActivityService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(42L)
                .email("alex.morgan@gmail.com")
                .firstName("Alex")
                .lastName("Morgan")
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .loginCount(3)
                .lastLoginAt(Instant.now().minusSeconds(3600))
                .lastLoginIp("10.0.0.1")
                .lastLoginLocation("Mumbai, India")
                .build();
    }

    @Test
    @DisplayName("recordLoginSuccess increments login count, updates last login, and saves SUCCESS event")
    void recordLoginSuccess_IncrementsCountAndUpdatesLastLogin() {
        // Arrange
        EventContext context = new EventContext(
                "session-1",
                "106.51.72.100",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        );
        when(contextResolver.resolveContext()).thenReturn(context);

        GeoLocation geo = GeoLocation.builder()
                .country("India")
                .stateRegion("Karnataka")
                .city("Bengaluru")
                .status("RESOLVED")
                .build();
        when(geolocationService.resolveLocation("106.51.72.100")).thenReturn(geo);

        when(loginEventRepository.save(any(UserLoginEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        UserLoginEvent event = loginActivityService.recordLoginSuccess(testUser, "PASSWORD");

        // Assert Event
        assertThat(event).isNotNull();
        assertThat(event.getUserId()).isEqualTo(42L);
        assertThat(event.getUserEmail()).isEqualTo("alex.morgan@gmail.com");
        assertThat(event.getUserRole()).isEqualTo("CUSTOMER");
        assertThat(event.getAuthMethod()).isEqualTo("PASSWORD");
        assertThat(event.getLoginResult()).isEqualTo("SUCCESS");
        assertThat(event.getFailureReason()).isNull();
        assertThat(event.getIpAddress()).isEqualTo("106.51.72.100");
        assertThat(event.getIpVersion()).isEqualTo("IPV4");
        assertThat(event.getCity()).isEqualTo("Bengaluru");
        assertThat(event.getCountry()).isEqualTo("India");
        assertThat(event.getBrowser()).isEqualTo("Google Chrome");
        assertThat(event.getOperatingSystem()).isEqualTo("Windows 10/11");
        assertThat(event.getDeviceType()).isEqualTo("DESKTOP");

        // Assert User metrics updated
        assertThat(testUser.getLoginCount()).isEqualTo(4);
        assertThat(testUser.getLastLoginIp()).isEqualTo("106.51.72.100");
        assertThat(testUser.getLastLoginLocation()).isEqualTo("Bengaluru, India");
        verify(userRepository, times(1)).save(testUser);
        verify(loginEventRepository, times(1)).save(any(UserLoginEvent.class));
    }

    @Test
    @DisplayName("recordLoginFailure saves FAILED event and does not increment user login count")
    void recordLoginFailure_DoesNotIncrementCountAndSavesFailure() {
        // Arrange
        EventContext context = new EventContext(
                "session-2",
                "127.0.0.1",
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"
        );
        when(contextResolver.resolveContext()).thenReturn(context);

        GeoLocation geo = GeoLocation.builder()
                .country("Local")
                .stateRegion("Loopback")
                .city("Localhost")
                .status("LOCAL_DEV")
                .build();
        when(geolocationService.resolveLocation("127.0.0.1")).thenReturn(geo);

        when(loginEventRepository.save(any(UserLoginEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        UserLoginEvent event = loginActivityService.recordLoginFailure(
                testUser.getEmail(), testUser.getRole().name(), "PASSWORD", "INVALID_CREDENTIALS", testUser.getId()
        );

        // Assert
        assertThat(event).isNotNull();
        assertThat(event.getUserId()).isEqualTo(42L);
        assertThat(event.getUserEmail()).isEqualTo("alex.morgan@gmail.com");
        assertThat(event.getLoginResult()).isEqualTo("FAILED");
        assertThat(event.getFailureReason()).isEqualTo("INVALID_CREDENTIALS");
        assertThat(event.getOperatingSystem()).isEqualTo("iOS");
        assertThat(event.getDeviceType()).isEqualTo("MOBILE");

        // User repository must NOT be called to update metrics on failure
        verify(userRepository, never()).save(any(User.class));
        assertThat(testUser.getLoginCount()).isEqualTo(3);
    }

    @Test
    @DisplayName("recordLoginFailure handles unknown user with null userId")
    void recordLoginFailure_UserNotFound() {
        // Arrange
        EventContext context = new EventContext(
                "session-3",
                "49.207.210.5",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        );
        when(contextResolver.resolveContext()).thenReturn(context);

        GeoLocation geo = GeoLocation.builder()
                .country("India")
                .stateRegion("Maharashtra")
                .city("Pune")
                .status("RESOLVED")
                .build();
        when(geolocationService.resolveLocation(anyString())).thenReturn(geo);

        when(loginEventRepository.save(any(UserLoginEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        UserLoginEvent event = loginActivityService.recordLoginFailure(
                "nonexistent@domain.com", "UNKNOWN", "PASSWORD", "USER_NOT_FOUND", null
        );

        // Assert
        assertThat(event.getUserId()).isNull();
        assertThat(event.getUserEmail()).isEqualTo("nonexistent@domain.com");
        assertThat(event.getUserRole()).isEqualTo("UNKNOWN");
        assertThat(event.getFailureReason()).isEqualTo("USER_NOT_FOUND");
        assertThat(event.getOperatingSystem()).isEqualTo("macOS");
    }

    @Test
    @DisplayName("getRecentLoginHistory delegates to repository with userId ordering")
    void getRecentLoginHistory_ReturnsList() {
        UserLoginEvent event1 = UserLoginEvent.builder().id(1L).userId(42L).loginResult("SUCCESS").build();
        UserLoginEvent event2 = UserLoginEvent.builder().id(2L).userId(42L).loginResult("FAILED").build();

        when(loginEventRepository.findTop20ByUserIdOrderByLoginTimestampDesc(42L))
                .thenReturn(List.of(event1, event2));

        List<UserLoginEvent> result = loginActivityService.getRecentLoginHistory(42L);
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("cleanupOldLoginEvents calls repository with cutoff date")
    void cleanupOldLoginEvents_CallsRepository() {
        when(loginEventRepository.deleteOldEvents(any(Instant.class))).thenReturn(15);

        int deleted = loginActivityService.cleanupOldLoginEvents(90);
        assertThat(deleted).isEqualTo(15);
        verify(loginEventRepository, times(1)).deleteOldEvents(any(Instant.class));
    }

    @Test
    @DisplayName("getLoginStatistics aggregates counts accurately")
    void getLoginStatistics_AggregatesCounts() {
        when(loginEventRepository.countByLoginResult("SUCCESS")).thenReturn(80L);
        when(loginEventRepository.countByLoginResult("FAILED")).thenReturn(20L);
        when(userRepository.count()).thenReturn(15L);

        Map<String, Object> stats = loginActivityService.getLoginStatistics();
        assertThat(stats.get("totalSuccessLogins")).isEqualTo(80L);
        assertThat(stats.get("totalFailedLogins")).isEqualTo(20L);
        assertThat(stats.get("totalUsers")).isEqualTo(15L);
        assertThat(stats.get("loginSuccessRate")).isEqualTo(80L);
    }
}
