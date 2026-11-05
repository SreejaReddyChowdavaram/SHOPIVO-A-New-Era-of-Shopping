package com.securecommerce.platform.user.dto;

import com.securecommerce.platform.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/**
 * UserResponse — Safe User Data Transfer Object
 *
 * WHY A DTO?
 *   The User entity contains passwordHash. If we returned the entity directly
 *   from a controller, Jackson would serialize passwordHash into the JSON response.
 *   This is a critical security vulnerability — even hashed passwords should
 *   never leave the server.
 *
 *   A DTO (Data Transfer Object) is a plain object containing ONLY the fields
 *   we intentionally want to expose. Controllers return DTOs, never entities.
 *
 * THE PATTERN:
 *   Entity (database layer) → Service → DTO (API layer) → JSON response
 *   The entity never crosses the controller boundary.
 *
 * STATIC FACTORY METHOD (from()):
 *   UserResponse.from(user) is a clean way to convert entity → DTO.
 *   Alternative: MapStruct mapper (added when we need bulk mapping in list endpoints).
 *   For now, a simple static method is clearer and sufficient.
 */
@Getter
@Builder
public class UserResponse {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private boolean enabled;
    private Instant createdAt;

    // Notice: NO passwordHash field — intentionally excluded

    /**
     * Convert a User entity to a UserResponse DTO.
     * Called in AuthService after creating/finding a user.
     */
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
