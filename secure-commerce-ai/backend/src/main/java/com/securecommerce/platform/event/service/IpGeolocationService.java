package com.securecommerce.platform.event.service;

import com.securecommerce.platform.event.dto.GeoLocation;

public interface IpGeolocationService {
    GeoLocation resolveLocation(String ipAddress);
}

