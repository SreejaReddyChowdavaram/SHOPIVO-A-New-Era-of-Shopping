package com.securecommerce.platform.security.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JwtUtil — JWT Generation and Validation
 *
 * WHAT IS A JWT?
 *   JSON Web Token — a compact, self-contained string for securely transmitting
 *   information between parties. A JWT has three base64-encoded parts:
 *     Header.Payload.Signature
 *
 *   Header:    { "alg": "HS256", "typ": "JWT" }
 *   Payload:   { "sub": "42", "role": "CUSTOMER", "iat": 1736..., "exp": 1736... }
 *   Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
 *
 * WHY SELF-CONTAINED?
 *   The payload contains the user ID and role. The server doesn't need to
 *   query the database on every request — it just validates the signature.
 *   If the signature is valid, it trusts the payload contents.
 *
 * SECURITY:
 *   The HMAC signature uses a secret key known only to the server.
 *   If someone tampers with the payload, the signature becomes invalid.
 *   Tokens expire (configurable, default 24h) — old tokens stop working.
 *
 * CLAIMS WE USE:
 *   subject (sub)  → User ID (Long, stored as String)
 *   "role"         → User role: CUSTOMER, SELLER, or ADMIN
 *   issuedAt (iat) → When the token was created
 *   expiration (exp) → When the token expires
 *
 * @Component: Registered as a Spring bean so it can be @Autowired
 *             into JwtAuthFilter and AuthService.
 */
@Slf4j
@Component
public class JwtUtil {

    public static final String DEFAULT_DEV_SECRET = "ThisIsAPlaceholderSecretThatMustBeReplacedInProductionWithA256BitKey";

    private final SecretKey signingKey;
    private final long expirationMs;

    /**
     * @Value reads from application.yml → app.jwt.secret and app.jwt.expiration-ms
     * If the env var JWT_SECRET is not set, the yml default is used.
     * In production: JWT_SECRET must be set to a cryptographically random 256-bit value.
     */
    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            Environment env) {

        // In production profile, strictly validate that an insecure default secret is not used
        if (env != null && (env.matchesProfiles("prod") || env.matchesProfiles("production"))) {
            if (secret == null || secret.isBlank() || DEFAULT_DEV_SECRET.equals(secret.trim())) {
                throw new IllegalStateException(
                    "CRITICAL SECURITY CONFIGURATION ERROR: Production profile ('prod') cannot run with " +
                    "the default development JWT secret placeholder. Please set a secure, random 256-bit " +
                    "JWT_SECRET environment variable."
                );
            }
            if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
                throw new IllegalStateException(
                    "CRITICAL SECURITY CONFIGURATION ERROR: Production JWT secret must be at least " +
                    "256 bits (32 bytes) in length."
                );
            }
        }

        // Convert the secret string to a SecretKey for HMAC-SHA256
        // The key must be at least 256 bits (32 bytes) for HS256
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Generate a signed JWT token for a user.
     *
     * @param userId The user's database ID (becomes the token subject)
     * @param role   The user's role (stored as a custom claim)
     * @return Signed JWT string, e.g. "eyJhbGci..."
     */
    public String generateToken(Long userId, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(userId))    // sub = user ID
                .claim("role", role)                // custom claim
                .issuedAt(now)                       // iat
                .expiration(expiry)                  // exp
                .signWith(signingKey)                // HMAC-SHA256
                .compact();                          // build the JWT string
    }

    /**
     * Validate a JWT token.
     * Returns true if the token is signed by us and has not expired.
     * Returns false for any invalid token — expired, tampered, or malformed.
     *
     * Logs the specific error for server-side debugging without leaking details.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("JWT token expired: {}", e.getMessage());
        } catch (JwtException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Extract the user ID from a validated token's subject claim.
     *
     * @param token A validated JWT string
     * @return The user's ID as a Long
     */
    public Long extractUserId(String token) {
        return Long.parseLong(getClaims(token).getSubject());
    }

    /**
     * Extract the role from a validated token's custom claim.
     *
     * @param token A validated JWT string
     * @return Role string: "CUSTOMER", "SELLER", or "ADMIN"
     */
    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    // ─── Private helpers ──────────────────────────────────────

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
