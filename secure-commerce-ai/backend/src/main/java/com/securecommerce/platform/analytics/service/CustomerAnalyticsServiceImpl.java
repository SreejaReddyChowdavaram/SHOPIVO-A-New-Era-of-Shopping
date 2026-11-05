package com.securecommerce.platform.analytics.service;

import com.securecommerce.platform.analytics.dto.*;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderItem;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.returns.entity.Refund;
import com.securecommerce.platform.returns.entity.ReturnRequest;
import com.securecommerce.platform.returns.repository.RefundRepository;
import com.securecommerce.platform.returns.repository.ReturnRequestRepository;
import com.securecommerce.platform.wishlist.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerAnalyticsServiceImpl implements CustomerAnalyticsService {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMM ''yy", Locale.ENGLISH);

    private final OrderRepository orderRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final RefundRepository refundRepository;
    private final WishlistRepository wishlistRepository;

    @Override
    public CustomerAnalyticsOverviewResponse getOverview(Long customerId, DateRange range) {
        Instant start = range.start();
        Instant end = range.end();

        long totalOrders = orderRepository.countByCustomerIdAndCreatedAtBetween(customerId, start, end);
        long deliveredOrders = orderRepository.countByCustomerIdAndStatusAndCreatedAtBetween(
                customerId, OrderStatus.DELIVERED, start, end);
        long pending = orderRepository.countByCustomerIdAndStatusAndCreatedAtBetween(
                customerId, OrderStatus.PENDING, start, end);
        long confirmed = orderRepository.countByCustomerIdAndStatusAndCreatedAtBetween(
                customerId, OrderStatus.CONFIRMED, start, end);
        long processing = orderRepository.countByCustomerIdAndStatusAndCreatedAtBetween(
                customerId, OrderStatus.PROCESSING, start, end);
        long pendingOrders = pending + confirmed + processing;

        long cancelledOrders = orderRepository.countByCustomerIdAndStatusAndCreatedAtBetween(
                customerId, OrderStatus.CANCELLED, start, end);

        long returnedOrders = returnRequestRepository.countByCustomerIdAndRequestedAtBetween(customerId, start, end);

        BigDecimal spent = orderRepository.sumTotalAmountByCustomerIdAndStatusNotCancelledBetween(customerId, start, end);
        BigDecimal totalAmountSpent = spent != null ? spent : BigDecimal.ZERO;

        BigDecimal refunds = refundRepository.sumRefundedAmountByCustomerIdBetween(customerId, start, end);
        BigDecimal totalRefundAmount = refunds != null ? refunds : BigDecimal.ZERO;

        long wishlistCount = wishlistRepository.findByUserId(customerId)
                .map(w -> (long) (w.getItems() != null ? w.getItems().size() : 0))
                .orElse(0L);

        return new CustomerAnalyticsOverviewResponse(
                totalOrders,
                deliveredOrders,
                pendingOrders,
                cancelledOrders,
                returnedOrders,
                totalAmountSpent,
                totalRefundAmount,
                wishlistCount,
                range.label()
        );
    }

    @Override
    public CustomerChartsResponse getCharts(Long customerId, DateRange range) {
        List<Order> orders = orderRepository.findByCustomerIdAndCreatedAtBetweenWithItems(
                customerId, range.start(), range.end());
        List<ReturnRequest> returns = returnRequestRepository.findByCustomerIdWithDetails(customerId).stream()
                .filter(r -> r.getRequestedAt() != null &&
                        !r.getRequestedAt().isBefore(range.start()) &&
                        !r.getRequestedAt().isAfter(range.end()))
                .toList();

        // 1. Order Status Distribution (Donut Chart)
        long totalOrdersCount = orders.size();
        long delivered = orders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count();
        long pending = orders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING ||
                o.getStatus() == OrderStatus.CONFIRMED ||
                o.getStatus() == OrderStatus.PROCESSING).count();
        long shipped = orders.stream().filter(o -> o.getStatus() == OrderStatus.SHIPPED).count();
        long cancelled = orders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count();
        long returned = returns.size();

        long sumForPct = totalOrdersCount > 0 ? totalOrdersCount : 1;
        List<StatusDistributionSegment> statusDist = List.of(
                new StatusDistributionSegment("Delivered", delivered, roundPct(delivered, sumForPct), "#10b981"),
                new StatusDistributionSegment("Pending", pending, roundPct(pending, sumForPct), "#f59e0b"),
                new StatusDistributionSegment("Shipped", shipped, roundPct(shipped, sumForPct), "#3b82f6"),
                new StatusDistributionSegment("Cancelled", cancelled, roundPct(cancelled, sumForPct), "#ef4444"),
                new StatusDistributionSegment("Returned", returned, roundPct(returned, sumForPct), "#ec4899")
        );

        // 2. Monthly Grouping for Timeline / Comparisons
        Map<YearMonth, MonthAggregate> monthMap = new TreeMap<>();

        // Seed continuous months if range is recent 6-12 months or bounded
        YearMonth currentYm = YearMonth.now(ZoneOffset.UTC);
        if (range.start().isAfter(Instant.EPOCH)) {
            YearMonth startYm = YearMonth.from(range.start().atZone(ZoneOffset.UTC));
            YearMonth endYm = YearMonth.from(range.end().atZone(ZoneOffset.UTC));
            if (!startYm.isAfter(endYm)) {
                for (YearMonth ym = startYm; !ym.isAfter(endYm); ym = ym.plusMonths(1)) {
                    monthMap.put(ym, new MonthAggregate());
                }
            }
        }

        // Aggregate orders
        for (Order o : orders) {
            YearMonth ym = YearMonth.from(o.getCreatedAt().atZone(ZoneOffset.UTC));
            MonthAggregate agg = monthMap.computeIfAbsent(ym, k -> new MonthAggregate());
            agg.orderCount++;
            if (o.getStatus() != OrderStatus.CANCELLED && o.getTotalAmount() != null) {
                agg.amountSpent = agg.amountSpent.add(o.getTotalAmount());
            }
        }

        // Aggregate returns
        for (ReturnRequest r : returns) {
            YearMonth ym = YearMonth.from(r.getRequestedAt().atZone(ZoneOffset.UTC));
            MonthAggregate agg = monthMap.computeIfAbsent(ym, k -> new MonthAggregate());
            agg.returnedCount++;
        }

        // If monthMap is still empty (e.g. no activity in all time), supply current month with 0
        if (monthMap.isEmpty()) {
            monthMap.put(currentYm, new MonthAggregate());
        }

        List<MonthlyPurchasePoint> monthlyPurchases = new ArrayList<>();
        List<MonthlyPurchasePoint> spendingAnalysis = new ArrayList<>();
        List<PurchaseVsReturnPoint> purchaseVsReturns = new ArrayList<>();

        for (Map.Entry<YearMonth, MonthAggregate> entry : monthMap.entrySet()) {
            String label = entry.getKey().format(MONTH_FORMATTER);
            MonthAggregate val = entry.getValue();

            monthlyPurchases.add(new MonthlyPurchasePoint(label, val.orderCount, val.amountSpent));
            spendingAnalysis.add(new MonthlyPurchasePoint(label, val.orderCount, val.amountSpent));
            purchaseVsReturns.add(new PurchaseVsReturnPoint(
                    label,
                    val.orderCount,
                    val.returnedCount,
                    val.amountSpent,
                    BigDecimal.ZERO
            ));
        }

        return new CustomerChartsResponse(
                monthlyPurchases,
                statusDist,
                spendingAnalysis,
                purchaseVsReturns
        );
    }

    @Override
    public CustomerRecentActivityResponse getRecentActivity(Long customerId) {
        List<Order> orders = orderRepository.findByCustomerIdWithItems(customerId);
        List<RecentPurchaseItem> recentPurchases = new ArrayList<>();

        for (Order o : orders) {
            if (o.getItems() != null) {
                for (OrderItem item : o.getItems()) {
                    String img = item.getProduct() != null ? item.getProduct().getImageUrl() : null;
                    recentPurchases.add(new RecentPurchaseItem(
                            o.getId(),
                            item.getProduct() != null ? item.getProduct().getId() : null,
                            item.getProductNameSnapshot(),
                            img,
                            item.getQuantity(),
                            item.getPriceSnapshot(),
                            item.getLineTotal(),
                            o.getStatus().name(),
                            o.getCreatedAt()
                    ));
                    if (recentPurchases.size() >= 10) break;
                }
            }
            if (recentPurchases.size() >= 10) break;
        }

        List<ReturnRequest> returns = returnRequestRepository.findByCustomerIdWithDetails(customerId);
        List<RecentReturnItem> recentReturns = new ArrayList<>();

        for (ReturnRequest r : returns) {
            String prodName = r.getOrderItem() != null ? r.getOrderItem().getProductNameSnapshot() : "Product";
            String img = (r.getOrderItem() != null && r.getOrderItem().getProduct() != null)
                    ? r.getOrderItem().getProduct().getImageUrl() : null;

            Optional<Refund> refundOpt = refundRepository.findByReturnRequestId(r.getId());
            String refStatus = refundOpt.map(ref -> ref.getRefundStatus().name()).orElse("N/A");
            BigDecimal refAmt = refundOpt.map(Refund::getRefundAmount).orElse(BigDecimal.ZERO);

            recentReturns.add(new RecentReturnItem(
                    r.getId(),
                    r.getOrder() != null ? r.getOrder().getId() : null,
                    prodName,
                    img,
                    r.getReason(),
                    r.getStatus().name(),
                    refStatus,
                    refAmt,
                    r.getRequestedAt()
            ));
            if (recentReturns.size() >= 8) break;
        }

        return new CustomerRecentActivityResponse(recentPurchases, recentReturns);
    }

    private static double roundPct(long count, long total) {
        if (total <= 0) return 0.0;
        return BigDecimal.valueOf((count * 100.0) / total)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private static class MonthAggregate {
        long orderCount = 0;
        long returnedCount = 0;
        BigDecimal amountSpent = BigDecimal.ZERO;
    }
}

