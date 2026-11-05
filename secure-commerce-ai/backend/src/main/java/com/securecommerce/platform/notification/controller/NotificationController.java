package com.securecommerce.platform.notification.controller;

import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.notification.dto.NotificationResponse;
import com.securecommerce.platform.notification.dto.UnreadCountResponse;
import com.securecommerce.platform.notification.service.NotificationService;
import com.securecommerce.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get all notifications for the authenticated customer (newest first).
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal User currentUser) {
        List<NotificationResponse> notifications = notificationService.getMyNotifications(currentUser);
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", notifications));
    }

    /**
     * Get unread notifications count for the authenticated customer.
     */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            @AuthenticationPrincipal User currentUser) {
        long count = notificationService.getUnreadCount(currentUser);
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", new UnreadCountResponse(count)));
    }

    /**
     * Mark a single notification as read.
     */
    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        NotificationResponse response = notificationService.markAsRead(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", response));
    }

    /**
     * Mark all notifications as read for current customer.
     */
    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal User currentUser) {
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }
}
