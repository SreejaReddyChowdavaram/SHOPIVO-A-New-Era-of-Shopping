package com.securecommerce.platform.address.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @NotBlank(message = "Label is required (e.g. Home, Work)")
        @Size(max = 50, message = "Label must not exceed 50 characters")
        String label,

        @NotBlank(message = "Full name is required")
        @Size(max = 150, message = "Full name must not exceed 150 characters")
        String fullName,

        @NotBlank(message = "Phone number is required")
        @Size(max = 30, message = "Phone must not exceed 30 characters")
        String phone,

        @NotBlank(message = "Address line 1 is required")
        @Size(max = 255, message = "Address line 1 must not exceed 255 characters")
        String line1,

        @Size(max = 255, message = "Address line 2 must not exceed 255 characters")
        String line2,

        @NotBlank(message = "City is required")
        @Size(max = 100, message = "City must not exceed 100 characters")
        String city,

        @NotBlank(message = "State is required")
        @Size(max = 100, message = "State must not exceed 100 characters")
        String state,

        @NotBlank(message = "Postal code is required")
        @Size(max = 20, message = "Postal code must not exceed 20 characters")
        String postalCode,

        @Size(max = 100, message = "Country must not exceed 100 characters")
        String country,

        boolean isDefault
) {}
