package com.securecommerce.platform.exception;

import com.securecommerce.platform.auth.exception.DuplicateEmailException;
import com.securecommerce.platform.auth.exception.InvalidCredentialsException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;


/**
 * GlobalExceptionHandler — Centralized Error Handling
 *
 * WHY THIS EXISTS:
 *   Without this class, every exception that propagates out of a controller
 *   or service returns Spring Boot's default "whitelabel error page" or a
 *   generic 500 response. Neither is useful for an API consumer.
 *
 *   @RestControllerAdvice makes this class intercept ALL exceptions from
 *   ALL controllers, format them as ApiError JSON, and return the correct
 *   HTTP status code.
 *
 *   This is the "single responsibility" principle applied to error handling:
 *   controllers never need to catch exceptions — they just throw them,
 *   and this class handles the response formatting.
 *
 * HOW IT WORKS:
 *   Spring Security, MVC, and our own code throw exceptions.
 *   Spring looks for a matching @ExceptionHandler method in this class.
 *   If found, that method builds and returns the error response.
 *   The client gets a clean, consistent JSON error — not an HTML page.
 *
 * PLACEMENT LESSON:
 *   @RestControllerAdvice = @ControllerAdvice + @ResponseBody
 *   It applies globally to all @RestController classes in the application.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles @Valid / @Validated failures on @RequestBody.
     *
     * Triggered when: A controller method parameter annotated with @Valid fails
     * because the incoming JSON violates constraints like @NotBlank, @Email, @Size.
     *
     * Example: POST /api/auth/register with missing email field
     * Returns HTTP 400 with list of all failing field constraints.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        List<String> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .toList();

        log.warn("Validation failed at {}: {}", request.getRequestURI(), details);

        ApiError error = ApiError.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Failed")
                .message("Request validation failed. Please check the provided data.")
                .details(details)
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Handles constraint violations on @PathVariable and @RequestParam.
     *
     * Example: GET /api/products/-1 where id must be positive
     * Returns HTTP 400.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request) {

        List<String> details = ex.getConstraintViolations()
                .stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .toList();

        ApiError error = ApiError.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Failed")
                .message("Constraint violation")
                .details(details)
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Handles Spring Security authentication failures.
     * Triggered when: No JWT token provided, or token is invalid/expired.
     * Returns HTTP 401 Unauthorized.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthenticationException(
            AuthenticationException ex,
            HttpServletRequest request) {

        log.warn("Authentication failed at {}: {}", request.getRequestURI(), ex.getMessage());

        ApiError error = ApiError.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .error("Unauthorized")
                .message("Authentication required. Please log in.")
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Handles Spring Security authorization failures.
     * Triggered when: User is authenticated but does not have the required role.
     * Example: A CUSTOMER tries to access /api/admin/users
     * Returns HTTP 403 Forbidden.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request) {

        log.warn("Access denied at {} for user: {}", request.getRequestURI(), ex.getMessage());

        ApiError error = ApiError.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .error("Forbidden")
                .message("You do not have permission to access this resource.")
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    /**
     * Handles type mismatch in path variables.
     * Example: GET /api/products/abc where id is expected to be a Long.
     * Returns HTTP 400.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {

        String detail = String.format("Parameter '%s' should be of type %s",
                ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");

        ApiError error = ApiError.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message("Invalid parameter type")
                .details(List.of(detail))
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Handles duplicate email during registration.
     * Returns HTTP 409 Conflict.
     */
    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiError> handleDuplicateEmail(
            DuplicateEmailException ex,
            HttpServletRequest request) {

        log.warn("Duplicate email registration attempt at {}", request.getRequestURI());

        ApiError error = ApiError.builder()
                .status(HttpStatus.CONFLICT.value())
                .error("Conflict")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * Handles invalid login credentials.
     * Returns HTTP 401 Unauthorized.
     */
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentials(
            InvalidCredentialsException ex,
            HttpServletRequest request) {

        log.warn("Failed login attempt at {}", request.getRequestURI());

        ApiError error = ApiError.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .error("Unauthorized")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Handles ResponseStatusException thrown by services/controllers.
     * Returns the exact HTTP status code and reason message.
     */
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatusException(
            org.springframework.web.server.ResponseStatusException ex,
            HttpServletRequest request) {

        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;

        ApiError error = ApiError.builder()
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(ex.getReason() != null ? ex.getReason() : ex.getMessage())
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(status).body(error);
    }

    /**
     * Catch-all handler for unexpected exceptions.
     *
     * IMPORTANT: This logs the full stack trace server-side (for debugging),
     * but returns only a generic message to the client.
     * NEVER expose stack traces or internal details to API consumers.
     * Returns HTTP 500.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAllOtherExceptions(
            Exception ex,
            HttpServletRequest request) {

        // Log the full stack trace for server-side debugging
        log.error("Unexpected error at {}", request.getRequestURI(), ex);

        ApiError error = ApiError.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("An unexpected error occurred. Please try again later.")
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.internalServerError().body(error);
    }
}
