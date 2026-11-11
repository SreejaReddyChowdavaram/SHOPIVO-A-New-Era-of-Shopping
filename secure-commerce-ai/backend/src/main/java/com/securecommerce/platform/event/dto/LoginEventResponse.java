package com.securecommerce.platform.event.dto;

import com.securecommerce.platform.event.entity.UserLoginEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * LoginEventResponse — Safe DTO for exposing login events to the user and admin views.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginEventResponse {

    private Long id;
    private Long userId;
    private String userEmail;
    private String userRole;
    private String authMethod;
    private Instant loginTimestamp;
    private String ipAddress;
    private String ipVersion;
    private String country;
    private String stateRegion;
    private String city;
    private String locationStatus;
    private String browser;
    private String operatingSystem;
    private String deviceType;
    private String loginResult;
    private String failureReason;

    public static LoginEventResponse from(UserLoginEvent event) {
        if (event == null) return null;
        return LoginEventResponse.builder()
                .id(event.getId())
                .userId(event.getUserId())
                .userEmail(event.getUserEmail())
                .userRole(event.getUserRole())
                .authMethod(event.getAuthMethod())
                .loginTimestamp(event.getLoginTimestamp())
                .ipAddress(event.getIpAddress())
                .ipVersion(event.getIpVersion())
                .country(event.getCountry())
                .stateRegion(event.getStateRegion())
                .city(event.getCity())
                .locationStatus(event.getLocationStatus())
                .browser(event.getBrowser())
                .operatingSystem(event.getOperatingSystem())
                .deviceType(event.getDeviceType())
                .loginResult(event.getLoginResult())
                .failureReason(event.getFailureReason())
                .build();
    }
}

