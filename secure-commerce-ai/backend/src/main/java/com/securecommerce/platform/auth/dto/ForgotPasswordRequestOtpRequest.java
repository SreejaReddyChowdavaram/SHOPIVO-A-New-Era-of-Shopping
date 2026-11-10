package com.securecommerce.platform.auth.dto;

import com.securecommerce.platform.user.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequestOtpRequest {

    @NotBlank(message = "Registered email address is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotNull(message = "Portal role is required")
    private User.Role portalRole;
}

