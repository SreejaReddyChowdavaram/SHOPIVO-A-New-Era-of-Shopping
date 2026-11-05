package com.securecommerce.platform.returns.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReturnRequest(
        @NotNull(message = "Order ID is required")
        Long orderId,

        Long orderItemId,

        @NotBlank(message = "Return reason is required")
        @Size(max = 100, message = "Reason must not exceed 100 characters")
        String reason,

        @Size(max = 1000, message = "Return note must not exceed 1000 characters")
        String returnNote
) {}
