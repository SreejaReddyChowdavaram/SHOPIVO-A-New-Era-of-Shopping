package com.securecommerce.platform.user.repository;

import com.securecommerce.platform.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * UserRepository — Spring Data JPA Repository
 *
 * HOW SPRING DATA JPA WORKS:
 *   By extending JpaRepository<User, Long>, Spring automatically generates
 *   implementations for all standard CRUD operations at startup:
 *     save(user)        → INSERT or UPDATE
 *     findById(id)      → SELECT WHERE id = ?
 *     findAll()         → SELECT *
 *     deleteById(id)    → DELETE WHERE id = ?
 *     existsById(id)    → SELECT COUNT(*) WHERE id = ?
 *   No implementation class needed — Spring creates a proxy at runtime.
 *
 * CUSTOM QUERIES:
 *   Spring Data derives the SQL from the method name.
 *   findByEmail(email) → SELECT * FROM users WHERE email = ?
 *   existsByEmail(email) → SELECT COUNT(*) > 0 WHERE email = ?
 *   The method name IS the query. No @Query annotation needed for simple cases.
 *
 * WHY Optional<User>?
 *   findByEmail returns Optional because the user may not exist.
 *   Using Optional forces the caller to handle the "not found" case explicitly
 *   instead of doing null checks and risking NullPointerException.
 *   authService.login() does: findByEmail(...).orElseThrow(() -> new Exception(...))
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find a user by their email address.
     * Used in: login, JWT filter (look up user from token subject), ME endpoint.
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if an email is already registered.
     * Used in: register — to reject duplicate emails before calling save().
     * More efficient than findByEmail() because it doesn't load the full entity.
     */
    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query(
            value = "SELECT u FROM User u WHERE " +
                    "(:role IS NULL OR u.role = :role) AND " +
                    "(:enabled IS NULL OR u.enabled = :enabled) AND " +
                    "(:searchPattern IS NULL OR " +
                    " CAST(u.id AS string) LIKE :searchPattern OR " +
                    " LOWER(u.firstName) LIKE :searchPattern OR " +
                    " LOWER(u.lastName) LIKE :searchPattern OR " +
                    " LOWER(u.email) LIKE :searchPattern) " +
                    "ORDER BY u.createdAt DESC",
            countQuery = "SELECT count(u.id) FROM User u WHERE " +
                    "(:role IS NULL OR u.role = :role) AND " +
                    "(:enabled IS NULL OR u.enabled = :enabled) AND " +
                    "(:searchPattern IS NULL OR " +
                    " CAST(u.id AS string) LIKE :searchPattern OR " +
                    " LOWER(u.firstName) LIKE :searchPattern OR " +
                    " LOWER(u.lastName) LIKE :searchPattern OR " +
                    " LOWER(u.email) LIKE :searchPattern)")
    org.springframework.data.domain.Page<User> findUsersWithFilters(
            @org.springframework.data.repository.query.Param("role") User.Role role,
            @org.springframework.data.repository.query.Param("enabled") Boolean enabled,
            @org.springframework.data.repository.query.Param("searchPattern") String searchPattern,
            org.springframework.data.domain.Pageable pageable);

    long countByRole(User.Role role);

    long countByRoleAndEnabled(User.Role role, boolean enabled);

    long countByEnabled(boolean enabled);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM User u " +
            "WHERE u.role = :role AND u.createdAt >= :start AND u.createdAt <= :end")
    long countByRoleAndCreatedAtBetween(
            @org.springframework.data.repository.query.Param("role") User.Role role,
            @org.springframework.data.repository.query.Param("start") java.time.Instant start,
            @org.springframework.data.repository.query.Param("end") java.time.Instant end);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u " +
            "WHERE u.role = :role AND u.createdAt >= :start AND u.createdAt <= :end " +
            "ORDER BY u.createdAt ASC")
    java.util.List<User> findUsersByRoleAndCreatedAtBetween(
            @org.springframework.data.repository.query.Param("role") User.Role role,
            @org.springframework.data.repository.query.Param("start") java.time.Instant start,
            @org.springframework.data.repository.query.Param("end") java.time.Instant end);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u " +
            "WHERE u.role = :role ORDER BY u.createdAt DESC")
    java.util.List<User> findRecentUsersByRole(
            @org.springframework.data.repository.query.Param("role") User.Role role,
            org.springframework.data.domain.Pageable pageable);
}
