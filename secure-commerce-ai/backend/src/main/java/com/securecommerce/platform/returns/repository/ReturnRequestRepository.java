package com.securecommerce.platform.returns.repository;

import com.securecommerce.platform.returns.entity.ReturnRequest;
import com.securecommerce.platform.returns.entity.ReturnStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM ReturnRequest r WHERE r.id = :id")
    Optional<ReturnRequest> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT r FROM ReturnRequest r " +
           "JOIN FETCH r.order o " +
           "JOIN FETCH r.customer c " +
           "LEFT JOIN FETCH r.orderItem i " +
           "WHERE c.id = :customerId " +
           "ORDER BY r.requestedAt DESC")
    List<ReturnRequest> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    @Query("SELECT r FROM ReturnRequest r " +
           "JOIN FETCH r.order o " +
           "JOIN FETCH r.customer c " +
           "LEFT JOIN FETCH r.orderItem i " +
           "WHERE o.id = :orderId " +
           "ORDER BY r.requestedAt DESC")
    List<ReturnRequest> findByOrderIdWithDetails(@Param("orderId") Long orderId);

    @Query("SELECT r FROM ReturnRequest r " +
           "JOIN FETCH r.order o " +
           "JOIN FETCH r.customer c " +
           "LEFT JOIN FETCH r.orderItem i " +
           "WHERE r.id = :id")
    Optional<ReturnRequest> findByIdWithDetails(@Param("id") Long id);

    boolean existsByOrderIdAndStatusNotIn(Long orderId, List<ReturnStatus> excludedStatuses);

    boolean existsByOrderIdAndOrderItemIdAndStatusNotIn(Long orderId, Long orderItemId, List<ReturnStatus> excludedStatuses);

    @Query("SELECT COUNT(r) FROM ReturnRequest r " +
           "WHERE r.customer.id = :customerId " +
           "AND r.requestedAt >= :start AND r.requestedAt <= :end")
    long countByCustomerIdAndRequestedAtBetween(@Param("customerId") Long customerId,
                                                @Param("start") java.time.Instant start,
                                                @Param("end") java.time.Instant end);

    @Query("SELECT COUNT(r) FROM ReturnRequest r " +
           "JOIN r.orderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND r.requestedAt >= :start AND r.requestedAt <= :end")
    long countBySellerIdAndRequestedAtBetween(@Param("sellerId") Long sellerId,
                                              @Param("start") java.time.Instant start,
                                              @Param("end") java.time.Instant end);

    @Query("SELECT r FROM ReturnRequest r " +
           "JOIN r.orderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND r.requestedAt >= :start AND r.requestedAt <= :end")
    List<ReturnRequest> findBySellerIdAndRequestedAtBetween(@Param("sellerId") Long sellerId,
                                                            @Param("start") java.time.Instant start,
                                                            @Param("end") java.time.Instant end);

    @Query("SELECT COUNT(r) FROM ReturnRequest r " +
           "WHERE r.requestedAt >= :start AND r.requestedAt <= :end")
    long countByRequestedAtBetween(@Param("start") java.time.Instant start,
                                   @Param("end") java.time.Instant end);

    @Query("SELECT r FROM ReturnRequest r " +
           "JOIN FETCH r.customer c " +
           "LEFT JOIN FETCH r.orderItem oi " +
           "ORDER BY r.requestedAt DESC")
    List<ReturnRequest> findRecentReturnsForAdmin(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT r FROM ReturnRequest r " +
           "JOIN FETCH r.order o " +
           "JOIN FETCH r.customer c " +
           "LEFT JOIN FETCH r.orderItem i " +
           "LEFT JOIN FETCH r.seller s " +
           "WHERE (r.seller.id = :sellerId OR i.seller.id = :sellerId) " +
           "ORDER BY r.requestedAt DESC")
    List<ReturnRequest> findBySellerIdWithDetails(@Param("sellerId") Long sellerId);

    @Query("SELECT r FROM ReturnRequest r " +
           "JOIN FETCH r.order o " +
           "JOIN FETCH r.customer c " +
           "LEFT JOIN FETCH r.orderItem i " +
           "LEFT JOIN FETCH r.seller s " +
           "ORDER BY r.requestedAt DESC")
    List<ReturnRequest> findAllWithDetails();
}
