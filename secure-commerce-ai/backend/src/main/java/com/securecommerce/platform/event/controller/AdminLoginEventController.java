package com.securecommerce.platform.event.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.event.dto.LoginEventResponse;
import com.securecommerce.platform.event.entity.UserLoginEvent;
import com.securecommerce.platform.event.service.LoginActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AdminLoginEventController — Platform-wide authentication monitoring and security audits.
 *
 * Scoped strictly to ROLE_ADMIN.
 */
@Slf4j
@RestController
@RequestMapping("/admin/login-events")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminLoginEventController {

    private final LoginActivityService loginActivityService;

    /**
     * GET /api/admin/login-events
     * Paginated and filterable login event inspection.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<LoginEventResponse>>> getLoginEvents(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String authMethod,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "loginTimestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        Page<UserLoginEvent> events = loginActivityService.getAdminLoginEvents(
                role, result, authMethod, search, pageRequest
        );

        Page<LoginEventResponse> response = events.map(LoginEventResponse::from);
        return ResponseEntity.ok(ApiResponse.success("Login events retrieved successfully", response));
    }

    /**
     * GET /api/admin/login-events/stats
     * Aggregated authentication metrics.
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLoginStats() {
        Map<String, Object> stats = loginActivityService.getLoginStatistics();
        return ResponseEntity.ok(ApiResponse.success("Login statistics retrieved successfully", stats));
    }

    /**
     * POST /api/admin/login-events/cleanup
     * Retention policy cleanup for events older than retentionDays.
     */
    @PostMapping("/cleanup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cleanupOldEvents(
            @RequestParam(defaultValue = "365") int retentionDays
    ) {
        int deletedCount = loginActivityService.cleanupOldLoginEvents(retentionDays);
        return ResponseEntity.ok(ApiResponse.success(
                "Cleaned up " + deletedCount + " login events older than " + retentionDays + " days",
                Map.of("deletedCount", deletedCount, "retentionDays", retentionDays)
        ));
    }
}

