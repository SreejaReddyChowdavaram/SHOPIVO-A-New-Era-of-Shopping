package com.securecommerce.platform.analytics.service;

import com.securecommerce.platform.analytics.dto.*;
import com.securecommerce.platform.order.entity.OrderItem;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderItemRepository;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.returns.entity.ReturnRequest;
import com.securecommerce.platform.returns.repository.RefundRepository;
import com.securecommerce.platform.returns.repository.ReturnRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SellerAnalyticsServiceImpl implements SellerAnalyticsService {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMM ''yy", Locale.ENGLISH);

    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final RefundRepository refundRepository;
    private final ReturnRequestRepository returnRequestRepository;

    @Override
    public SellerAnalyticsSummaryResponse getSummary(Long sellerId, String range) {
        Instant since = calculateSinceInstant(range);

        long totalOrders = orderItemRepository.countTotalOrdersBySeller(sellerId, since);
        long completedOrders = orderItemRepository.countOrdersBySellerAndStatus(sellerId, OrderStatus.DELIVERED, since);
        long cancelledOrders = orderItemRepository.countOrdersBySellerAndStatus(sellerId, OrderStatus.CANCELLED, since);
        long unitsSold = orderItemRepository.sumUnitsSoldBySeller(sellerId, since);
        BigDecimal grossSales = orderItemRepository.sumGrossSalesBySeller(sellerId, since);
        BigDecimal refundedAmount = refundRepository.sumRefundedAmountBySellerItem(sellerId, since);

        return new SellerAnalyticsSummaryResponse(
                totalOrders,
                completedOrders,
                cancelledOrders,
                unitsSold,
                grossSales != null ? grossSales : BigDecimal.ZERO,
                refundedAmount != null ? refundedAmount : BigDecimal.ZERO
        );
    }

    @Override
    public List<DailySalesPoint> getSalesTrend(Long sellerId, String range) {
        Instant since = calculateSinceInstant(range);
        List<OrderItem> items = orderItemRepository.findSellerOrderItemsForSalesTrend(sellerId, since);

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Map<LocalDate, DailyAgg> dateMap = new LinkedHashMap<>();

        if ("7d".equalsIgnoreCase(range)) {
            LocalDate start = today.minusDays(6);
            for (LocalDate d = start; !d.isAfter(today); d = d.plusDays(1)) {
                dateMap.put(d, new DailyAgg());
            }
        } else if ("30d".equalsIgnoreCase(range)) {
            LocalDate start = today.minusDays(29);
            for (LocalDate d = start; !d.isAfter(today); d = d.plusDays(1)) {
                dateMap.put(d, new DailyAgg());
            }
        } else {
            // "all" time
            if (items.isEmpty()) {
                return Collections.emptyList();
            }
            LocalDate earliest = items.stream()
                    .map(item -> LocalDate.ofInstant(item.getOrder().getCreatedAt(), ZoneOffset.UTC))
                    .min(LocalDate::compareTo)
                    .orElse(today);

            // Populate from earliest day up to today (up to 90 continuous days if recent, or distinct active days)
            long daySpan = java.time.temporal.ChronoUnit.DAYS.between(earliest, today);
            if (daySpan <= 90) {
                for (LocalDate d = earliest; !d.isAfter(today); d = d.plusDays(1)) {
                    dateMap.put(d, new DailyAgg());
                }
            }
        }

        // Aggregate actual sales into the date map
        for (OrderItem item : items) {
            LocalDate itemDate = LocalDate.ofInstant(item.getOrder().getCreatedAt(), ZoneOffset.UTC);
            DailyAgg agg = dateMap.computeIfAbsent(itemDate, k -> new DailyAgg());
            agg.orderIds.add(item.getOrder().getId());
            agg.units += item.getQuantity();
            agg.sales = agg.sales.add(item.getLineTotal());
        }

        return dateMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new DailySalesPoint(
                        entry.getKey().toString(),
                        entry.getValue().orderIds.size(),
                        entry.getValue().units,
                        entry.getValue().sales
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<TopSellingProductResponse> getTopProducts(Long sellerId, String range, int limit) {
        Instant since = calculateSinceInstant(range);
        int maxLimit = Math.max(1, Math.min(limit, 50));

        List<OrderItemRepository.TopProductProjection> projections =
                orderItemRepository.findTopSellingProducts(sellerId, since, PageRequest.of(0, maxLimit));

        if (projections.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> productIds = projections.stream()
                .map(OrderItemRepository.TopProductProjection::getProductId)
                .filter(Objects::nonNull)
                .toList();

        Map<Long, Integer> stockMap = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Product::getStockQuantity, (existing, replacement) -> existing));

        return projections.stream()
                .map(p -> new TopSellingProductResponse(
                        p.getProductId(),
                        p.getProductName(),
                        p.getUnitsSold() != null ? p.getUnitsSold() : 0L,
                        p.getGrossSales() != null ? p.getGrossSales() : BigDecimal.ZERO,
                        stockMap.getOrDefault(p.getProductId(), 0)
                ))
                .collect(Collectors.toList());
    }

    /**
     * Determines UTC Instant threshold based on range string.
     * Returns Instant.EPOCH for "all" or unspecified range to ensure valid PostgreSQL parameter binding.
     */
    private Instant calculateSinceInstant(String range) {
        if (range == null || range.trim().isEmpty() || "all".equalsIgnoreCase(range.trim())) {
            return Instant.EPOCH;
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if ("7d".equalsIgnoreCase(range.trim())) {
            return today.minusDays(6).atStartOfDay(ZoneOffset.UTC).toInstant();
        } else if ("30d".equalsIgnoreCase(range.trim())) {
            return today.minusDays(29).atStartOfDay(ZoneOffset.UTC).toInstant();
        }

        return Instant.EPOCH;
    }

    @Override
    public SellerAnalyticsOverviewResponse getOverview(Long sellerId, DateRange range) {
        Instant start = range.start();
        Instant end = range.end();

        long totalProducts = productRepository.countBySellerId(sellerId);
        long activeProducts = productRepository.countBySellerIdAndStatus(sellerId, Product.Status.APPROVED);

        long totalOrdersReceived = orderItemRepository.countTotalOrdersBySellerBetween(sellerId, start, end);
        long unitsSold = orderItemRepository.sumUnitsSoldBySellerBetween(sellerId, start, end);
        long deliveredOrders = orderItemRepository.countOrdersBySellerAndStatusBetween(sellerId, OrderStatus.DELIVERED, start, end);
        long pending = orderItemRepository.countOrdersBySellerAndStatusBetween(sellerId, OrderStatus.PENDING, start, end);
        long confirmed = orderItemRepository.countOrdersBySellerAndStatusBetween(sellerId, OrderStatus.CONFIRMED, start, end);
        long processing = orderItemRepository.countOrdersBySellerAndStatusBetween(sellerId, OrderStatus.PROCESSING, start, end);
        long pendingOrders = pending + confirmed + processing;
        long cancelledOrders = orderItemRepository.countOrdersBySellerAndStatusBetween(sellerId, OrderStatus.CANCELLED, start, end);
        long returnedOrders = returnRequestRepository.countBySellerIdAndRequestedAtBetween(sellerId, start, end);

        BigDecimal grossSales = orderItemRepository.sumGrossSalesBySellerBetween(sellerId, start, end);
        BigDecimal refundAmount = refundRepository.sumRefundedAmountBySellerItemBetween(sellerId, start, end);

        return new SellerAnalyticsOverviewResponse(
                totalProducts,
                activeProducts,
                totalOrdersReceived,
                unitsSold,
                deliveredOrders,
                pendingOrders,
                cancelledOrders,
                returnedOrders,
                grossSales != null ? grossSales : BigDecimal.ZERO,
                refundAmount != null ? refundAmount : BigDecimal.ZERO,
                range.label()
        );
    }

    @Override
    public SellerChartsResponse getCharts(Long sellerId, DateRange range) {
        Instant start = range.start();
        Instant end = range.end();

        List<OrderItem> items = orderItemRepository.findSellerOrderItemsBetween(sellerId, start, end);
        List<ReturnRequest> returns = returnRequestRepository.findBySellerIdAndRequestedAtBetween(sellerId, start, end);

        // Status Distribution
        long delivered = orderItemRepository.countOrdersBySellerAndStatusBetween(sellerId, OrderStatus.DELIVERED, start, end);
        long pending = orderItemRepository.countOrdersBySellerAndStatusBetween(sellerId, OrderStatus.PENDING, start, end)
                + orderItemRepository.countOrdersBySellerAndStatusBetween(sellerId, OrderStatus.CONFIRMED, start, end)
                + orderItemRepository.countOrdersBySellerAndStatusBetween(sellerId, OrderStatus.PROCESSING, start, end);
        long shipped = orderItemRepository.countOrdersBySellerAndStatusBetween(sellerId, OrderStatus.SHIPPED, start, end);
        long cancelled = orderItemRepository.countOrdersBySellerAndStatusBetween(sellerId, OrderStatus.CANCELLED, start, end);
        long returned = returns.size();

        long sumForPct = (delivered + pending + shipped + cancelled + returned);
        if (sumForPct == 0) sumForPct = 1;

        List<StatusDistributionSegment> statusDist = List.of(
                new StatusDistributionSegment("Delivered", delivered, roundPct(delivered, sumForPct), "#10b981"),
                new StatusDistributionSegment("Pending", pending, roundPct(pending, sumForPct), "#f59e0b"),
                new StatusDistributionSegment("Shipped", shipped, roundPct(shipped, sumForPct), "#3b82f6"),
                new StatusDistributionSegment("Cancelled", cancelled, roundPct(cancelled, sumForPct), "#ef4444"),
                new StatusDistributionSegment("Returned", returned, roundPct(returned, sumForPct), "#ec4899")
        );

        // Monthly grouping
        Map<YearMonth, SellerMonthAggregate> monthMap = new TreeMap<>();
        YearMonth currentYm = YearMonth.now(ZoneOffset.UTC);

        if (start.isAfter(Instant.EPOCH)) {
            YearMonth startYm = YearMonth.from(start.atZone(ZoneOffset.UTC));
            YearMonth endYm = YearMonth.from(end.atZone(ZoneOffset.UTC));
            if (!startYm.isAfter(endYm)) {
                for (YearMonth ym = startYm; !ym.isAfter(endYm); ym = ym.plusMonths(1)) {
                    monthMap.put(ym, new SellerMonthAggregate());
                }
            }
        }

        for (OrderItem item : items) {
            YearMonth ym = YearMonth.from(item.getOrder().getCreatedAt().atZone(ZoneOffset.UTC));
            SellerMonthAggregate agg = monthMap.computeIfAbsent(ym, k -> new SellerMonthAggregate());
            agg.orderIds.add(item.getOrder().getId());
            agg.unitsSold += item.getQuantity();
            if (item.getLineTotal() != null) {
                agg.grossSales = agg.grossSales.add(item.getLineTotal());
            }
        }

        for (ReturnRequest r : returns) {
            YearMonth ym = YearMonth.from(r.getRequestedAt().atZone(ZoneOffset.UTC));
            SellerMonthAggregate agg = monthMap.computeIfAbsent(ym, k -> new SellerMonthAggregate());
            agg.returnedCount++;
        }

        if (monthMap.isEmpty()) {
            monthMap.put(currentYm, new SellerMonthAggregate());
        }

        List<MonthlySalesPoint> monthlySales = new ArrayList<>();
        List<MonthlySalesPoint> ordersReceived = new ArrayList<>();
        List<SalesVsReturnPoint> salesVsReturns = new ArrayList<>();
        List<MonthlySalesPoint> revenueOverview = new ArrayList<>();

        for (Map.Entry<YearMonth, SellerMonthAggregate> entry : monthMap.entrySet()) {
            String label = entry.getKey().format(MONTH_FORMATTER);
            SellerMonthAggregate val = entry.getValue();

            monthlySales.add(new MonthlySalesPoint(label, val.grossSales, val.orderIds.size(), val.unitsSold));
            ordersReceived.add(new MonthlySalesPoint(label, val.grossSales, val.orderIds.size(), val.unitsSold));
            long totalUnits = val.unitsSold > 0 ? val.unitsSold : 1;
            salesVsReturns.add(new SalesVsReturnPoint(
                    label,
                    val.unitsSold,
                    val.returnedCount,
                    roundPct(val.returnedCount, totalUnits),
                    val.grossSales,
                    BigDecimal.ZERO
            ));
            revenueOverview.add(new MonthlySalesPoint(label, val.grossSales, val.orderIds.size(), val.unitsSold));
        }

        // Top Selling Products
        List<TopSellingProductResponse> topProducts = getTopProductsBetween(sellerId, start, end, 5);

        return new SellerChartsResponse(
                monthlySales,
                ordersReceived,
                statusDist,
                topProducts,
                salesVsReturns,
                revenueOverview
        );
    }

    private List<TopSellingProductResponse> getTopProductsBetween(Long sellerId, Instant start, Instant end, int limit) {
        List<OrderItemRepository.TopProductProjection> projections =
                orderItemRepository.findTopSellingProductsBetween(sellerId, start, end, PageRequest.of(0, limit));

        if (projections.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> productIds = projections.stream()
                .map(OrderItemRepository.TopProductProjection::getProductId)
                .filter(Objects::nonNull)
                .toList();

        Map<Long, Integer> stockMap = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Product::getStockQuantity, (existing, replacement) -> existing));

        return projections.stream()
                .map(p -> new TopSellingProductResponse(
                        p.getProductId(),
                        p.getProductName(),
                        p.getUnitsSold() != null ? p.getUnitsSold() : 0L,
                        p.getGrossSales() != null ? p.getGrossSales() : BigDecimal.ZERO,
                        stockMap.getOrDefault(p.getProductId(), 0)
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<SellerRecentOrderResponse> getRecentOrders(Long sellerId, int limit) {
        int maxLimit = Math.max(1, Math.min(limit, 50));
        List<OrderItem> items = orderItemRepository.findRecentOrderItemsForSeller(sellerId, PageRequest.of(0, maxLimit));

        return items.stream()
                .map(oi -> {
                    String customerName = "Customer";
                    if (oi.getOrder() != null && oi.getOrder().getCustomer() != null) {
                        customerName = (oi.getOrder().getCustomer().getFirstName() != null ? oi.getOrder().getCustomer().getFirstName() : "")
                                + " " + (oi.getOrder().getCustomer().getLastName() != null ? oi.getOrder().getCustomer().getLastName() : "");
                        customerName = customerName.trim();
                        if (customerName.isEmpty()) {
                            customerName = oi.getOrder().getCustomer().getEmail();
                        }
                    }
                    String img = oi.getProduct() != null ? oi.getProduct().getImageUrl() : null;
                    return new SellerRecentOrderResponse(
                            oi.getOrder() != null ? oi.getOrder().getId() : null,
                            customerName,
                            oi.getProductNameSnapshot(),
                            img,
                            oi.getQuantity(),
                            oi.getLineTotal(),
                            oi.getOrder() != null ? oi.getOrder().getStatus().name() : "UNKNOWN",
                            oi.getOrder() != null ? oi.getOrder().getCreatedAt() : Instant.now()
                    );
                })
                .collect(Collectors.toList());
    }

    private static double roundPct(long count, long total) {
        if (total <= 0) return 0.0;
        return BigDecimal.valueOf((count * 100.0) / total)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private static class SellerMonthAggregate {
        final Set<Long> orderIds = new HashSet<>();
        long unitsSold = 0L;
        long returnedCount = 0L;
        BigDecimal grossSales = BigDecimal.ZERO;
    }

    private static class DailyAgg {
        final Set<Long> orderIds = new HashSet<>();
        long units = 0L;
        BigDecimal sales = BigDecimal.ZERO;
    }
}
