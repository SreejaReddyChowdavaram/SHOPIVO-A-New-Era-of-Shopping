package com.securecommerce.platform.payment.repository;

import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p JOIN FETCH p.order WHERE p.customer.id = :customerId ORDER BY p.createdAt DESC")
    List<Payment> findByCustomerIdOrderByCreatedAtDesc(@Param("customerId") Long customerId);

    Optional<Payment> findFirstByOrderIdOrderByCreatedAtDesc(Long orderId);

    default Optional<Payment> findByOrderId(Long orderId) {
        return findFirstByOrderIdOrderByCreatedAtDesc(orderId);
    }

    List<Payment> findAllByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<Payment> findByTransactionId(String transactionId);

    Optional<Payment> findByProviderOrderId(String providerOrderId);

    Optional<Payment> findByProviderPaymentId(String providerPaymentId);

    Optional<Payment> findFirstByOrderIdAndPaymentStatusOrderByCreatedAtDesc(Long orderId, PaymentStatus paymentStatus);

    Optional<Payment> findFirstByOrderIdAndProviderOrderByCreatedAtDesc(Long orderId, String provider);

    boolean existsByOrderIdAndPaymentStatus(Long orderId, PaymentStatus paymentStatus);

    @Query(value = "SELECT p FROM Payment p JOIN FETCH p.order JOIN FETCH p.customer " +
            "WHERE (:status IS NULL OR p.paymentStatus = :status) " +
            "AND (:provider IS NULL OR p.provider = :provider) " +
            "ORDER BY p.createdAt DESC",
            countQuery = "SELECT COUNT(p) FROM Payment p " +
            "WHERE (:status IS NULL OR p.paymentStatus = :status) " +
            "AND (:provider IS NULL OR p.provider = :provider)")
    Page<Payment> findAllPagedForAdmin(@Param("status") PaymentStatus status,
                                      @Param("provider") String provider,
                                      Pageable pageable);

    default Page<Payment> findAllPagedForAdmin(Pageable pageable) {
        return findAllPagedForAdmin(null, null, pageable);
    }

    interface PaymentDistributionProjection {
        com.securecommerce.platform.payment.entity.PaymentMethod getPaymentMethod();
        PaymentStatus getPaymentStatus();
        Long getCount();
        java.math.BigDecimal getTotalAmount();
    }

    @Query("SELECT p.paymentMethod AS paymentMethod, p.paymentStatus AS paymentStatus, " +
           "COUNT(p) AS count, COALESCE(SUM(p.amount), 0.0) AS totalAmount " +
           "FROM Payment p " +
           "WHERE p.createdAt >= :start AND p.createdAt <= :end " +
           "GROUP BY p.paymentMethod, p.paymentStatus")
    List<PaymentDistributionProjection> findPaymentDistributionBetween(@Param("start") java.time.Instant start,
                                                                       @Param("end") java.time.Instant end);
}
