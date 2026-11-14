package com.securecommerce.platform.returns.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectReturnRequest(
        @NotBlank(message = "Rejection reason is required")
        String reason
) {}

