package com.securecommerce.platform.payment.repository;

import com.securecommerce.platform.payment.entity.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, Long> {

    Optional<PaymentWebhookEvent> findByEventId(String eventId);

    boolean existsByEventId(String eventId);
}
