package com.securecommerce.platform.returns.repository;

import com.securecommerce.platform.returns.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    @Query("SELECT ref FROM Refund ref " +
           "JOIN FETCH ref.order o " +
           "JOIN FETCH ref.returnRequest ret " +
           "LEFT JOIN FETCH ref.payment p " +
           "WHERE ref.customer.id = :customerId " +
           "ORDER BY ref.createdAt DESC")
    List<Refund> findByCustomerIdWithDetails(@Param("customerId") Long customerId);

    @Query("SELECT ref FROM Refund ref " +
           "JOIN FETCH ref.order o " +
           "JOIN FETCH ref.returnRequest ret " +
           "LEFT JOIN FETCH ref.payment p " +
           "WHERE ref.returnRequest.id = :returnRequestId")
    Optional<Refund> findByReturnRequestId(@Param("returnRequestId") Long returnRequestId);

    Optional<Refund> findByOrderId(Long orderId);

    boolean existsByReturnRequestId(Long returnRequestId);

    @Query("SELECT COALESCE(SUM(ref.refundAmount), 0.0) FROM Refund ref " +
           "JOIN ref.returnRequest ret " +
           "WHERE ref.refundStatus = com.securecommerce.platform.returns.entity.RefundStatus.SUCCESS " +
           "AND ret.orderItem.seller.id = :sellerId " +
           "AND ref.createdAt >= :since")
    java.math.BigDecimal sumRefundedAmountBySellerItem(@Param("sellerId") Long sellerId,
                                                       @Param("since") java.time.Instant since);

    @Query("SELECT COALESCE(SUM(ref.refundAmount), 0.0) FROM Refund ref " +
           "WHERE ref.customer.id = :customerId " +
           "AND ref.refundStatus = com.securecommerce.platform.returns.entity.RefundStatus.SUCCESS " +
           "AND ref.createdAt >= :start AND ref.createdAt <= :end")
    java.math.BigDecimal sumRefundedAmountByCustomerIdBetween(@Param("customerId") Long customerId,
                                                              @Param("start") java.time.Instant start,
                                                              @Param("end") java.time.Instant end);

    @Query("SELECT COALESCE(SUM(ref.refundAmount), 0.0) FROM Refund ref " +
           "JOIN ref.returnRequest ret " +
           "WHERE ref.refundStatus = com.securecommerce.platform.returns.entity.RefundStatus.SUCCESS " +
           "AND ret.orderItem.seller.id = :sellerId " +
           "AND ref.createdAt >= :start AND ref.createdAt <= :end")
    java.math.BigDecimal sumRefundedAmountBySellerItemBetween(@Param("sellerId") Long sellerId,
                                                              @Param("start") java.time.Instant start,
                                                              @Param("end") java.time.Instant end);

    @Query("SELECT COALESCE(SUM(ref.refundAmount), 0.0) FROM Refund ref " +
           "WHERE ref.refundStatus = com.securecommerce.platform.returns.entity.RefundStatus.SUCCESS " +
           "AND ref.createdAt >= :start AND ref.createdAt <= :end")
    java.math.BigDecimal sumRefundedAmountBetween(@Param("start") java.time.Instant start,
                                                  @Param("end") java.time.Instant end);
}
