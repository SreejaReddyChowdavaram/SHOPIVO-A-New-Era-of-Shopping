package com.securecommerce.platform.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * User.java — JPA Entity mapped to the `users` table
 *
 * HOW JPA ENTITIES WORK:
 *   @Entity tells Hibernate this class maps to a database table.
 *   Each field maps to a column. Hibernate generates SELECT/INSERT/UPDATE
 *   SQL automatically — we never write SQL for basic CRUD.
 *
 *   LESSON: @Entity + @Table + field annotations = the Java representation
 *   of your database table. The table itself is created by Flyway (V1 migration),
 *   and Hibernate VALIDATES that the entity matches it at startup (ddl-auto=validate).
 *
 * IMPORTANT: passwordHash field has NO getter in UserResponse.
 *   We control what data leaves the system via DTOs, not entities directly.
 *   Controllers always return DTOs — never the raw Entity.
 *
 * LOMBOK ANNOTATIONS:
 *   @Data       → generates getters, setters, equals, hashCode, toString
 *   @Builder    → enables User.builder().email("...").build() pattern
 *   @NoArgsConstructor, @AllArgsConstructor → required by JPA + Builder
 *
 * Role enum is defined inside this file because it's tightly coupled to User.
 * If roles grow complex, it would move to its own file.
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    // Named passwordHash (not password) to be explicit that it's hashed
    // The column in DB is password_hash (Hibernate converts camelCase to snake_case by default)
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    /**
     * Role stored as a string (EnumType.STRING) in the database.
     * EnumType.ORDINAL (the default) is dangerous — if you reorder the enum,
     * all stored values become wrong. STRING is always safe.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.CUSTOMER;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    /**
     * @CreationTimestamp: Hibernate sets this automatically when the entity
     * is first persisted. We never set it manually.
     * updatable = false: this column is set once and never changed.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * @UpdateTimestamp: Hibernate updates this automatically on every merge/save.
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Login activity tracking (added in V22 migration)
     */
    @Column(name = "login_count", nullable = false)
    @Builder.Default
    private int loginCount = 0;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "last_login_ip", length = 45)
    private String lastLoginIp;

    @Column(name = "last_login_location", length = 150)
    private String lastLoginLocation;

    /**
     * Authentication provider (added in V23 migration):
     * LOCAL  → Registered via email & password
     * GOOGLE → Registered via Google OAuth
     * LINKED → Registered via one provider and safely linked to both
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    // ─── Provider Enum ────────────────────────────────────────
    public enum AuthProvider {
        LOCAL,
        GOOGLE,
        LINKED
    }

    // ─── Role Enum ────────────────────────────────────────────
    public enum Role {
        CUSTOMER,
        SELLER,
        ADMIN
    }

    // ─── Convenience helper ───────────────────────────────────
    public String getFullName() {
        return firstName + " " + lastName;
    }
}
