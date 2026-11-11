package com.securecommerce.platform.order.repository;

import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.payment.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE o.customer.id = :customerId " +
           "ORDER BY o.createdAt DESC")
    List<Order> findByCustomerIdWithItems(@Param("customerId") Long customerId);

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE o.id = :orderId")
    Optional<Order> findByIdWithItems(@Param("orderId") Long orderId);

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product p " +
           "LEFT JOIN FETCH i.seller s " +
           "LEFT JOIN FETCH o.customer c " +
           "WHERE o.id = :orderId")
    Optional<Order> findByIdWithAllDetails(@Param("orderId") Long orderId);

    @Query("SELECT DISTINCT o FROM Order o " +
           "JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE i.seller.id = :sellerId " +
           "ORDER BY o.createdAt DESC")
    List<Order> findOrdersForSeller(@Param("sellerId") Long sellerId);

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE (:status IS NULL OR o.status = :status) " +
           "ORDER BY o.createdAt DESC")
    List<Order> findAllWithStatusFilter(@Param("status") OrderStatus status);

    @Query(value = "SELECT o FROM Order o " +
           "LEFT JOIN o.customer c " +
           "WHERE (:status IS NULL OR o.status = :status) " +
           "AND (:paymentStatus IS NULL OR EXISTS (SELECT 1 FROM Payment pay WHERE pay.order = o AND pay.paymentStatus = :paymentStatus)) " +
           "AND (:search IS NULL OR " +
           "     CAST(o.id AS string) LIKE :searchPattern OR " +
           "     LOWER(o.shippingFullName) LIKE :searchPattern OR " +
           "     LOWER(c.firstName) LIKE :searchPattern OR " +
           "     LOWER(c.lastName) LIKE :searchPattern OR " +
           "     LOWER(c.email) LIKE :searchPattern) " +
           "ORDER BY o.createdAt DESC",
           countQuery = "SELECT COUNT(o.id) FROM Order o " +
           "LEFT JOIN o.customer c " +
           "WHERE (:status IS NULL OR o.status = :status) " +
           "AND (:paymentStatus IS NULL OR EXISTS (SELECT 1 FROM Payment pay WHERE pay.order = o AND pay.paymentStatus = :paymentStatus)) " +
           "AND (:search IS NULL OR " +
           "     CAST(o.id AS string) LIKE :searchPattern OR " +
           "     LOWER(o.shippingFullName) LIKE :searchPattern OR " +
           "     LOWER(c.firstName) LIKE :searchPattern OR " +
           "     LOWER(c.lastName) LIKE :searchPattern OR " +
           "     LOWER(c.email) LIKE :searchPattern)")
    Page<Order> findAdminOrdersWithFilters(@Param("status") OrderStatus status,
                                          @Param("paymentStatus") PaymentStatus paymentStatus,
                                          @Param("search") String search,
                                          @Param("searchPattern") String searchPattern,
                                          Pageable pageable);

    long countByStatus(OrderStatus status);

    long countByCustomerId(Long customerId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o WHERE o.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED")
    BigDecimal sumTotalOrderValue();

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE o.customer.id = :customerId " +
           "AND o.createdAt >= :start AND o.createdAt <= :end " +
           "ORDER BY o.createdAt DESC")
    List<Order> findByCustomerIdAndCreatedAtBetweenWithItems(@Param("customerId") Long customerId,
                                                             @Param("start") java.time.Instant start,
                                                             @Param("end") java.time.Instant end);

    @Query("SELECT COUNT(o) FROM Order o " +
           "WHERE o.customer.id = :customerId " +
           "AND o.createdAt >= :start AND o.createdAt <= :end")
    long countByCustomerIdAndCreatedAtBetween(@Param("customerId") Long customerId,
                                              @Param("start") java.time.Instant start,
                                              @Param("end") java.time.Instant end);

    @Query("SELECT COUNT(o) FROM Order o " +
           "WHERE o.customer.id = :customerId AND o.status = :status " +
           "AND o.createdAt >= :start AND o.createdAt <= :end")
    long countByCustomerIdAndStatusAndCreatedAtBetween(@Param("customerId") Long customerId,
                                                       @Param("status") OrderStatus status,
                                                       @Param("start") java.time.Instant start,
                                                       @Param("end") java.time.Instant end);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o " +
           "WHERE o.customer.id = :customerId " +
           "AND o.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND o.createdAt >= :start AND o.createdAt <= :end")
    BigDecimal sumTotalAmountByCustomerIdAndStatusNotCancelledBetween(@Param("customerId") Long customerId,
                                                                      @Param("start") java.time.Instant start,
                                                                      @Param("end") java.time.Instant end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end")
    long countByCreatedAtBetween(@Param("start") java.time.Instant start, @Param("end") java.time.Instant end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status AND o.createdAt >= :start AND o.createdAt <= :end")
    long countByStatusAndCreatedAtBetween(@Param("status") OrderStatus status,
                                          @Param("start") java.time.Instant start,
                                          @Param("end") java.time.Instant end);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o " +
           "WHERE o.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND o.createdAt >= :start AND o.createdAt <= :end")
    BigDecimal sumTotalOrderValueBetween(@Param("start") java.time.Instant start, @Param("end") java.time.Instant end);

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE o.createdAt >= :start AND o.createdAt <= :end " +
           "ORDER BY o.createdAt DESC")
    List<Order> findAdminOrdersBetweenWithItems(@Param("start") java.time.Instant start, @Param("end") java.time.Instant end);

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product p " +
           "WHERE o.status = :status AND o.paymentExpiresAt IS NOT NULL AND o.paymentExpiresAt < :expiryTime")
    List<Order> findExpiredOrdersWithItems(@Param("status") OrderStatus status, @Param("expiryTime") java.time.Instant expiryTime);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.customer c ORDER BY o.createdAt DESC")
    List<Order> findRecentOrdersForAdmin(Pageable pageable);

    boolean existsByOrderReference(String orderReference);

    Optional<Order> findByOrderReference(String orderReference);
}
