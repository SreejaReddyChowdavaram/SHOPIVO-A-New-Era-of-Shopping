package com.securecommerce.platform.order.repository;

import com.securecommerce.platform.order.entity.OrderItem;
import com.securecommerce.platform.order.entity.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    List<OrderItem> findByOrderIdAndSellerId(Long orderId, Long sellerId);

    @Query("SELECT COUNT(DISTINCT oi.order.id) FROM OrderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND oi.order.createdAt >= :since")
    long countTotalOrdersBySeller(@Param("sellerId") Long sellerId, @Param("since") Instant since);

    @Query("SELECT COUNT(DISTINCT oi.order.id) FROM OrderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND oi.order.status = :status " +
           "AND oi.order.createdAt >= :since")
    long countOrdersBySellerAndStatus(@Param("sellerId") Long sellerId,
                                      @Param("status") OrderStatus status,
                                      @Param("since") Instant since);

    @Query("SELECT COALESCE(SUM(oi.quantity), 0) FROM OrderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND oi.order.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND oi.order.createdAt >= :since")
    long sumUnitsSoldBySeller(@Param("sellerId") Long sellerId, @Param("since") Instant since);

    @Query("SELECT COALESCE(SUM(oi.lineTotal), 0.0) FROM OrderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND oi.order.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND oi.order.createdAt >= :since")
    BigDecimal sumGrossSalesBySeller(@Param("sellerId") Long sellerId, @Param("since") Instant since);

    @Query("SELECT oi FROM OrderItem oi " +
           "JOIN FETCH oi.order o " +
           "WHERE oi.seller.id = :sellerId " +
           "AND o.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND o.createdAt >= :since " +
           "ORDER BY o.createdAt ASC")
    List<OrderItem> findSellerOrderItemsForSalesTrend(@Param("sellerId") Long sellerId, @Param("since") Instant since);

    @Query("SELECT COUNT(DISTINCT oi.order.id) FROM OrderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND oi.order.createdAt >= :start AND oi.order.createdAt <= :end")
    long countTotalOrdersBySellerBetween(@Param("sellerId") Long sellerId,
                                         @Param("start") Instant start,
                                         @Param("end") Instant end);

    @Query("SELECT COUNT(DISTINCT oi.order.id) FROM OrderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND oi.order.status = :status " +
           "AND oi.order.createdAt >= :start AND oi.order.createdAt <= :end")
    long countOrdersBySellerAndStatusBetween(@Param("sellerId") Long sellerId,
                                             @Param("status") OrderStatus status,
                                             @Param("start") Instant start,
                                             @Param("end") Instant end);

    @Query("SELECT COALESCE(SUM(oi.quantity), 0) FROM OrderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND oi.order.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND oi.order.createdAt >= :start AND oi.order.createdAt <= :end")
    long sumUnitsSoldBySellerBetween(@Param("sellerId") Long sellerId,
                                     @Param("start") Instant start,
                                     @Param("end") Instant end);

    @Query("SELECT COALESCE(SUM(oi.lineTotal), 0.0) FROM OrderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND oi.order.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND oi.order.createdAt >= :start AND oi.order.createdAt <= :end")
    BigDecimal sumGrossSalesBySellerBetween(@Param("sellerId") Long sellerId,
                                            @Param("start") Instant start,
                                            @Param("end") Instant end);

    @Query("SELECT oi FROM OrderItem oi " +
           "JOIN FETCH oi.order o " +
           "WHERE oi.seller.id = :sellerId " +
           "AND o.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND o.createdAt >= :start AND o.createdAt <= :end " +
           "ORDER BY o.createdAt ASC")
    List<OrderItem> findSellerOrderItemsBetween(@Param("sellerId") Long sellerId,
                                                @Param("start") Instant start,
                                                @Param("end") Instant end);

    interface TopProductProjection {
        Long getProductId();
        String getProductName();
        Long getUnitsSold();
        BigDecimal getGrossSales();
    }

    @Query("SELECT oi.product.id AS productId, " +
           "oi.productNameSnapshot AS productName, " +
           "SUM(oi.quantity) AS unitsSold, " +
           "SUM(oi.lineTotal) AS grossSales " +
           "FROM OrderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND oi.order.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND oi.order.createdAt >= :since " +
           "GROUP BY oi.product.id, oi.productNameSnapshot " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<TopProductProjection> findTopSellingProducts(@Param("sellerId") Long sellerId,
                                                      @Param("since") Instant since,
                                                      Pageable pageable);

    @Query("SELECT oi.product.id AS productId, " +
           "oi.productNameSnapshot AS productName, " +
           "SUM(oi.quantity) AS unitsSold, " +
           "SUM(oi.lineTotal) AS grossSales " +
           "FROM OrderItem oi " +
           "WHERE oi.seller.id = :sellerId " +
           "AND oi.order.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND oi.order.createdAt >= :start AND oi.order.createdAt <= :end " +
           "GROUP BY oi.product.id, oi.productNameSnapshot " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<TopProductProjection> findTopSellingProductsBetween(@Param("sellerId") Long sellerId,
                                                             @Param("start") Instant start,
                                                             @Param("end") Instant end,
                                                             Pageable pageable);

    interface AdminTopProductProjection {
        Long getProductId();
        String getProductName();
        String getSellerName();
        Long getUnitsSold();
        BigDecimal getGrossSales();
    }

    @Query("SELECT oi.product.id AS productId, " +
           "oi.productNameSnapshot AS productName, " +
           "CONCAT(oi.seller.firstName, ' ', oi.seller.lastName) AS sellerName, " +
           "SUM(oi.quantity) AS unitsSold, " +
           "SUM(oi.lineTotal) AS grossSales " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND oi.order.createdAt >= :start AND oi.order.createdAt <= :end " +
           "GROUP BY oi.product.id, oi.productNameSnapshot, oi.seller.firstName, oi.seller.lastName " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<AdminTopProductProjection> findPlatformTopSellingProductsBetween(@Param("start") Instant start,
                                                                          @Param("end") Instant end,
                                                                          Pageable pageable);

    interface TopSellerProjection {
        Long getSellerId();
        String getSellerName();
        BigDecimal getGrossSales();
        Long getOrdersCount();
        Long getUnitsSold();
    }

    @Query("SELECT oi.seller.id AS sellerId, " +
           "CONCAT(oi.seller.firstName, ' ', oi.seller.lastName) AS sellerName, " +
           "SUM(oi.lineTotal) AS grossSales, " +
           "COUNT(DISTINCT oi.order.id) AS ordersCount, " +
           "SUM(oi.quantity) AS unitsSold " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED " +
           "AND oi.order.createdAt >= :start AND oi.order.createdAt <= :end " +
           "GROUP BY oi.seller.id, oi.seller.firstName, oi.seller.lastName " +
           "ORDER BY SUM(oi.lineTotal) DESC")
    List<TopSellerProjection> findTopPerformingSellersBetween(@Param("start") Instant start,
                                                              @Param("end") Instant end,
                                                              Pageable pageable);

    @Query("SELECT oi FROM OrderItem oi " +
           "JOIN FETCH oi.order o " +
           "JOIN FETCH o.customer c " +
           "WHERE oi.seller.id = :sellerId " +
           "ORDER BY o.createdAt DESC")
    List<OrderItem> findRecentOrderItemsForSeller(@Param("sellerId") Long sellerId, Pageable pageable);
}
