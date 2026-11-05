package com.securecommerce.platform.auth.exception;

/**
 * DuplicateEmailException — thrown when registering with an already-used email.
 * Caught by GlobalExceptionHandler → HTTP 409 Conflict.
 */
public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String message) {
        super(message);
    }
}
