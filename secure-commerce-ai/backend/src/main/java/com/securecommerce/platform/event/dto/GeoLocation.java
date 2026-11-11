package com.securecommerce.platform.event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoLocation {
    private String country;
    private String stateRegion;
    private String city;
    private String status; // RESOLVED, LOCAL_DEV, UNAVAILABLE

    public static GeoLocation localDev() {
        return GeoLocation.builder()
                .country("Local Development")
                .stateRegion("Localhost")
                .city("Loopback")
                .status("LOCAL_DEV")
                .build();
    }

    public static GeoLocation unavailable() {
        return GeoLocation.builder()
                .country("Unknown")
                .stateRegion("Unknown")
                .city("Unknown")
                .status("UNAVAILABLE")
                .build();
    }
}

