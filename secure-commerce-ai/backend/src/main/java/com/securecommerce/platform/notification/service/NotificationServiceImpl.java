package com.securecommerce.platform.notification.service;

import com.securecommerce.platform.notification.dto.NotificationResponse;
import com.securecommerce.platform.notification.entity.Notification;
import com.securecommerce.platform.notification.entity.NotificationType;
import com.securecommerce.platform.notification.repository.NotificationRepository;
import com.securecommerce.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public Notification createNotification(
            User customer,
            NotificationType type,
            String title,
            String message,
            String referenceType,
            Long referenceId
    ) {
        if (customer == null || customer.getId() == null) {
            log.warn("Cannot create notification without valid customer entity");
            return null;
        }

        // Duplicate prevention for idempotent business events
        if (referenceType != null && referenceId != null) {
            boolean exists = notificationRepository.existsByCustomerIdAndTypeAndReferenceTypeAndReferenceId(
                    customer.getId(),
                    type,
                    referenceType,
                    referenceId
            );
            if (exists) {
                log.debug("Notification already exists for customerId={}, type={}, refType={}, refId={}",
                        customer.getId(), type, referenceType, referenceId);
                return null;
            }
        }

        Notification notification = Notification.builder()
                .customer(customer)
                .type(type)
                .title(title)
                .message(message)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Notification created: id={}, customerId={}, type={}, refType={}, refId={}",
                saved.getId(), customer.getId(), type, referenceType, referenceId);

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(User customer) {
        return notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(User customer) {
        return notificationRepository.countByCustomerIdAndIsReadFalse(customer.getId());
    }

    @Override
    public NotificationResponse markAsRead(Long id, User customer) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this notification");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
            log.debug("Notification marked as read: id={}, customerId={}", id, customer.getId());
        }

        return NotificationResponse.from(notification);
    }

    @Override
    public void markAllAsRead(User customer) {
        int updatedCount = notificationRepository.markAllAsReadByCustomerId(customer.getId(), Instant.now());
        log.info("All notifications marked as read for customerId={}, count={}", customer.getId(), updatedCount);
    }
}
