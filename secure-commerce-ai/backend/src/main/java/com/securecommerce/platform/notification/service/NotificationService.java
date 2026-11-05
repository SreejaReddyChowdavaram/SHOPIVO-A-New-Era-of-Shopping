package com.securecommerce.platform.notification.service;

import com.securecommerce.platform.notification.dto.NotificationResponse;
import com.securecommerce.platform.notification.entity.Notification;
import com.securecommerce.platform.notification.entity.NotificationType;
import com.securecommerce.platform.user.entity.User;

import java.util.List;

public interface NotificationService {

    Notification createNotification(
            User customer,
            NotificationType type,
            String title,
            String message,
            String referenceType,
            Long referenceId
    );

    List<NotificationResponse> getMyNotifications(User customer);

    long getUnreadCount(User customer);

    NotificationResponse markAsRead(Long id, User customer);

    void markAllAsRead(User customer);
}
