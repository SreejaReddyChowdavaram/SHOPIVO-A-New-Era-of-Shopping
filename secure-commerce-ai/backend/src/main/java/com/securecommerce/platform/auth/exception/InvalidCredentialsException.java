package com.securecommerce.platform.auth.exception;

/**
 * InvalidCredentialsException — thrown when login fails (wrong email or password).
 *
 * SECURITY: We use the same exception for both "user not found" and "wrong password".
 * This prevents email enumeration attacks — the attacker can't tell which accounts exist.
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Invalid email or password");
    }

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
