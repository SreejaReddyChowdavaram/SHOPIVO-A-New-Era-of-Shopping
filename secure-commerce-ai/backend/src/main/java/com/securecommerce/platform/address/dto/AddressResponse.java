package com.securecommerce.platform.address.dto;

import com.securecommerce.platform.address.entity.Address;

import java.time.Instant;

public record AddressResponse(
        Long id,
        String label,
        String fullName,
        String phone,
        String line1,
        String line2,
        String city,
        String state,
        String postalCode,
        String country,
        boolean isDefault,
        Instant createdAt,
        Instant updatedAt
) {
    public static AddressResponse from(Address address) {
        return new AddressResponse(
                address.getId(),
                address.getLabel(),
                address.getFullName(),
                address.getPhone(),
                address.getLine1(),
                address.getLine2(),
                address.getCity(),
                address.getState(),
                address.getPostalCode(),
                address.getCountry(),
                address.isDefault(),
                address.getCreatedAt(),
                address.getUpdatedAt()
        );
    }
}
