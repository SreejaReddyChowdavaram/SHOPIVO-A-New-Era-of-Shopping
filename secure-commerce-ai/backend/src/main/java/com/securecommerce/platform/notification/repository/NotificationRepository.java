package com.securecommerce.platform.notification.repository;

import com.securecommerce.platform.notification.entity.Notification;
import com.securecommerce.platform.notification.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    long countByCustomerIdAndIsReadFalse(Long customerId);

    Optional<Notification> findByIdAndCustomerId(Long id, Long customerId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now WHERE n.customer.id = :customerId AND n.isRead = false")
    int markAllAsReadByCustomerId(@Param("customerId") Long customerId, @Param("now") Instant now);

    boolean existsByCustomerIdAndTypeAndReferenceTypeAndReferenceId(
            Long customerId,
            NotificationType type,
            String referenceType,
            Long referenceId
    );
}
