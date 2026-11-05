package com.securecommerce.platform.notification.dto;

import com.securecommerce.platform.notification.entity.Notification;
import com.securecommerce.platform.notification.entity.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String message,
        String referenceType,
        Long referenceId,
        boolean read,
        Instant createdAt,
        Instant readAt
) {
    public static NotificationResponse from(Notification notification) {
        if (notification == null) return null;
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getReferenceType(),
                notification.getReferenceId(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
