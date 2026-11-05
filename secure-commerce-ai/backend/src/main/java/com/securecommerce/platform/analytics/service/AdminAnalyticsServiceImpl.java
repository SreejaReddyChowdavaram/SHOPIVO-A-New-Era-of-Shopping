package com.securecommerce.platform.analytics.service;

import com.securecommerce.platform.analytics.dto.*;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderItemRepository;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.returns.entity.Refund;
import com.securecommerce.platform.returns.entity.ReturnRequest;
import com.securecommerce.platform.returns.repository.RefundRepository;
import com.securecommerce.platform.returns.repository.ReturnRequestRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
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
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMM ''yy", Locale.ENGLISH);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public AdminAnalyticsOverviewResponse getOverview(DateRange range) {
        Instant start = range.start();
        Instant end = range.end();

        long totalCustomers = userRepository.countByRole(User.Role.CUSTOMER);
        long totalSellers = userRepository.countByRole(User.Role.SELLER);
        long totalProducts = productRepository.count();

        long totalOrders = orderRepository.countByCreatedAtBetween(start, end);
        long deliveredOrders = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.DELIVERED, start, end);
        long pending = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.PENDING, start, end);
        long confirmed = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.CONFIRMED, start, end);
        long processing = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.PROCESSING, start, end);
        long pendingOrders = pending + confirmed + processing;
        long cancelledOrders = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.CANCELLED, start, end);
        long returnedOrders = returnRequestRepository.countByRequestedAtBetween(start, end);

        BigDecimal gmv = orderRepository.sumTotalOrderValueBetween(start, end);
        BigDecimal totalOrderValue = gmv != null ? gmv : BigDecimal.ZERO;

        BigDecimal refunds = refundRepository.sumRefundedAmountBetween(start, end);
        BigDecimal refundAmount = refunds != null ? refunds : BigDecimal.ZERO;

        return new AdminAnalyticsOverviewResponse(
                totalCustomers,
                totalSellers,
                totalProducts,
                totalOrders,
                deliveredOrders,
                pendingOrders,
                cancelledOrders,
                returnedOrders,
                totalOrderValue,
                refundAmount,
                range.label()
        );
    }

    @Override
    public AdminChartsResponse getCharts(DateRange range) {
        Instant start = range.start();
        Instant end = range.end();

        // 1. Status Distribution
        long delivered = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.DELIVERED, start, end);
        long pending = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.PENDING, start, end)
                + orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.CONFIRMED, start, end)
                + orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.PROCESSING, start, end);
        long shipped = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.SHIPPED, start, end);
        long cancelled = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.CANCELLED, start, end);
        long returned = returnRequestRepository.countByRequestedAtBetween(start, end);

        long sumForPct = (delivered + pending + shipped + cancelled + returned);
        if (sumForPct == 0) sumForPct = 1;

        List<StatusDistributionSegment> statusDist = List.of(
                new StatusDistributionSegment("Delivered", delivered, roundPct(delivered, sumForPct), "#10b981"),
                new StatusDistributionSegment("Pending", pending, roundPct(pending, sumForPct), "#f59e0b"),
                new StatusDistributionSegment("Shipped", shipped, roundPct(shipped, sumForPct), "#3b82f6"),
                new StatusDistributionSegment("Cancelled", cancelled, roundPct(cancelled, sumForPct), "#ef4444"),
                new StatusDistributionSegment("Returned", returned, roundPct(returned, sumForPct), "#ec4899")
        );

        // 2. Monthly Timeline
        Map<YearMonth, AdminMonthAggregate> monthMap = new TreeMap<>();
        YearMonth currentYm = YearMonth.now(ZoneOffset.UTC);

        if (start.isAfter(Instant.EPOCH)) {
            YearMonth startYm = YearMonth.from(start.atZone(ZoneOffset.UTC));
            YearMonth endYm = YearMonth.from(end.atZone(ZoneOffset.UTC));
            if (!startYm.isAfter(endYm)) {
                for (YearMonth ym = startYm; !ym.isAfter(endYm); ym = ym.plusMonths(1)) {
                    monthMap.put(ym, new AdminMonthAggregate());
                }
            }
        }

        List<Order> orders = orderRepository.findAdminOrdersBetweenWithItems(start, end);
        for (Order o : orders) {
            YearMonth ym = YearMonth.from(o.getCreatedAt().atZone(ZoneOffset.UTC));
            AdminMonthAggregate agg = monthMap.computeIfAbsent(ym, k -> new AdminMonthAggregate());
            agg.totalOrders++;
            if (o.getStatus() == OrderStatus.DELIVERED) {
                agg.completedOrders++;
            } else if (o.getStatus() == OrderStatus.CANCELLED) {
                agg.cancelledOrders++;
            }
            if (o.getStatus() != OrderStatus.CANCELLED && o.getTotalAmount() != null) {
                agg.gmv = agg.gmv.add(o.getTotalAmount());
            }
        }

        List<User> customers = userRepository.findUsersByRoleAndCreatedAtBetween(User.Role.CUSTOMER, start, end);
        for (User u : customers) {
            YearMonth ym = YearMonth.from(u.getCreatedAt().atZone(ZoneOffset.UTC));
            AdminMonthAggregate agg = monthMap.computeIfAbsent(ym, k -> new AdminMonthAggregate());
            agg.newCustomers++;
        }

        List<User> sellers = userRepository.findUsersByRoleAndCreatedAtBetween(User.Role.SELLER, start, end);
        for (User u : sellers) {
            YearMonth ym = YearMonth.from(u.getCreatedAt().atZone(ZoneOffset.UTC));
            AdminMonthAggregate agg = monthMap.computeIfAbsent(ym, k -> new AdminMonthAggregate());
            agg.newSellers++;
        }

        if (monthMap.isEmpty()) {
            monthMap.put(currentYm, new AdminMonthAggregate());
        }

        List<MonthlyOrderPoint> orderTrends = new ArrayList<>();
        List<MonthlyGmvPoint> monthlyGmv = new ArrayList<>();
        List<MonthlyGrowthPoint> customerGrowth = new ArrayList<>();
        List<AdminPurchaseVsReturnPoint> purchaseVsReturns = new ArrayList<>();

        for (Map.Entry<YearMonth, AdminMonthAggregate> entry : monthMap.entrySet()) {
            String label = entry.getKey().format(MONTH_FORMATTER);
            AdminMonthAggregate val = entry.getValue();

            orderTrends.add(new MonthlyOrderPoint(label, val.totalOrders, val.completedOrders, val.cancelledOrders));
            monthlyGmv.add(new MonthlyGmvPoint(label, val.gmv, val.gmv.subtract(val.refundAmount)));
            customerGrowth.add(new MonthlyGrowthPoint(label, val.newCustomers, val.newSellers));
            long totalForRate = val.totalOrders > 0 ? val.totalOrders : 1;
            purchaseVsReturns.add(new AdminPurchaseVsReturnPoint(
                    label,
                    val.totalOrders,
                    val.returnedOrders,
                    roundPct(val.returnedOrders, totalForRate),
                    val.gmv,
                    val.refundAmount
            ));
        }

        // 3. Top Performing Sellers
        List<OrderItemRepository.TopSellerProjection> sellerProjections =
                orderItemRepository.findTopPerformingSellersBetween(start, end, PageRequest.of(0, 5));
        List<SellerPerformancePoint> sellerPerformance = sellerProjections.stream()
                .map(sp -> new SellerPerformancePoint(
                        sp.getSellerId(),
                        sp.getSellerName() != null ? sp.getSellerName() : "Seller #" + sp.getSellerId(),
                        sp.getGrossSales() != null ? sp.getGrossSales() : BigDecimal.ZERO,
                        sp.getOrdersCount() != null ? sp.getOrdersCount() : 0L,
                        sp.getUnitsSold() != null ? sp.getUnitsSold() : 0L
                ))
                .collect(Collectors.toList());

        // 4. Platform Top Products
        List<OrderItemRepository.AdminTopProductProjection> productProjections =
                orderItemRepository.findPlatformTopSellingProductsBetween(start, end, PageRequest.of(0, 5));
        List<AdminTopProductPoint> productPerformance = productProjections.stream()
                .map(pp -> new AdminTopProductPoint(
                        pp.getProductId(),
                        pp.getProductName(),
                        pp.getSellerName(),
                        pp.getUnitsSold() != null ? pp.getUnitsSold() : 0L,
                        pp.getGrossSales() != null ? pp.getGrossSales() : BigDecimal.ZERO
                ))
                .collect(Collectors.toList());

        // 5. Payment Distribution
        List<PaymentRepository.PaymentDistributionProjection> paymentProjections =
                paymentRepository.findPaymentDistributionBetween(start, end);

        Map<String, MethodAgg> methodMap = new LinkedHashMap<>();
        long totalPaymentCount = 0;
        for (PaymentRepository.PaymentDistributionProjection pp : paymentProjections) {
            String methodKey = pp.getPaymentMethod() != null ? pp.getPaymentMethod().name() : "OTHER";
            MethodAgg agg = methodMap.computeIfAbsent(methodKey, k -> new MethodAgg());
            long count = pp.getCount() != null ? pp.getCount() : 0L;
            agg.count += count;
            totalPaymentCount += count;
            if (pp.getTotalAmount() != null) {
                agg.total = agg.total.add(pp.getTotalAmount());
            }
        }

        final long totalPaymentsForPct = totalPaymentCount > 0 ? totalPaymentCount : 1;
        List<PaymentDistributionSegment> paymentDistribution = methodMap.entrySet().stream()
                .map(e -> new PaymentDistributionSegment(
                        formatPaymentMethod(e.getKey()),
                        e.getValue().count,
                        e.getValue().total,
                        roundPct(e.getValue().count, totalPaymentsForPct),
                        resolvePaymentColor(e.getKey())
                ))
                .collect(Collectors.toList());

        return new AdminChartsResponse(
                orderTrends,
                monthlyGmv,
                statusDist,
                customerGrowth,
                sellerPerformance,
                productPerformance,
                purchaseVsReturns,
                paymentDistribution
        );
    }

    @Override
    public AdminRecentActivityResponse getRecentActivity() {
        // 1. Recent Orders
        List<Order> recentOrdersList = orderRepository.findRecentOrdersForAdmin(PageRequest.of(0, 8));
        List<AdminRecentActivityResponse.RecentOrderRecord> recentOrders = recentOrdersList.stream()
                .map(o -> {
                    String customerName = "Guest / Customer";
                    if (o.getCustomer() != null) {
                        customerName = (o.getCustomer().getFirstName() != null ? o.getCustomer().getFirstName() : "")
                                + " " + (o.getCustomer().getLastName() != null ? o.getCustomer().getLastName() : "");
                        customerName = customerName.trim();
                        if (customerName.isEmpty()) {
                            customerName = o.getCustomer().getEmail();
                        }
                    } else if (o.getShippingFullName() != null) {
                        customerName = o.getShippingFullName();
                    }
                    return new AdminRecentActivityResponse.RecentOrderRecord(
                            o.getId(),
                            customerName,
                            o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO,
                            o.getStatus().name(),
                            o.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());

        // 2. New Customers
        List<User> recentCustomers = userRepository.findRecentUsersByRole(User.Role.CUSTOMER, PageRequest.of(0, 6));
        List<AdminRecentActivityResponse.RecentUserRecord> newCustomers = recentCustomers.stream()
                .map(u -> new AdminRecentActivityResponse.RecentUserRecord(
                        u.getId(),
                        (u.getFirstName() + " " + u.getLastName()).trim(),
                        u.getEmail(),
                        "CUSTOMER",
                        u.isEnabled(),
                        u.getCreatedAt()
                ))
                .collect(Collectors.toList());

        // 3. New Sellers
        List<User> recentSellers = userRepository.findRecentUsersByRole(User.Role.SELLER, PageRequest.of(0, 6));
        List<AdminRecentActivityResponse.RecentUserRecord> newSellers = recentSellers.stream()
                .map(u -> new AdminRecentActivityResponse.RecentUserRecord(
                        u.getId(),
                        (u.getFirstName() + " " + u.getLastName()).trim(),
                        u.getEmail(),
                        "SELLER",
                        u.isEnabled(),
                        u.getCreatedAt()
                ))
                .collect(Collectors.toList());

        // 4. Recent Returns
        List<ReturnRequest> recentReturnsList = returnRequestRepository.findRecentReturnsForAdmin(PageRequest.of(0, 6));
        List<AdminRecentActivityResponse.RecentReturnRecord> recentReturns = recentReturnsList.stream()
                .map(r -> {
                    String custName = r.getCustomer() != null ? (r.getCustomer().getFirstName() + " " + r.getCustomer().getLastName()).trim() : "Customer";
                    String prodName = r.getOrderItem() != null ? r.getOrderItem().getProductNameSnapshot() : "Product";
                    Optional<Refund> refundOpt = refundRepository.findByReturnRequestId(r.getId());
                    String refStatus = refundOpt.map(ref -> ref.getRefundStatus().name()).orElse("N/A");
                    BigDecimal refAmt = refundOpt.map(Refund::getRefundAmount).orElse(BigDecimal.ZERO);

                    return new AdminRecentActivityResponse.RecentReturnRecord(
                            r.getId(),
                            r.getOrder() != null ? r.getOrder().getId() : null,
                            custName,
                            prodName,
                            r.getReason(),
                            r.getStatus().name(),
                            refStatus,
                            refAmt,
                            r.getRequestedAt()
                    );
                })
                .collect(Collectors.toList());

        return new AdminRecentActivityResponse(recentOrders, newCustomers, newSellers, recentReturns);
    }

    private static double roundPct(long count, long total) {
        if (total <= 0) return 0.0;
        return BigDecimal.valueOf((count * 100.0) / total)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private static String formatPaymentMethod(String method) {
        if (method == null) return "Unknown";
        return switch (method.toUpperCase()) {
            case "CARD" -> "Credit / Debit Card";
            case "UPI" -> "UPI";
            case "NETBANKING" -> "Net Banking";
            case "WALLET" -> "Wallet";
            case "COD" -> "Cash On Delivery";
            default -> method;
        };
    }

    private static String resolvePaymentColor(String method) {
        if (method == null) return "#6b7280";
        return switch (method.toUpperCase()) {
            case "CARD" -> "#3b82f6";
            case "UPI" -> "#10b981";
            case "NETBANKING" -> "#8b5cf6";
            case "WALLET" -> "#f59e0b";
            case "COD" -> "#ec4899";
            default -> "#06b6d4";
        };
    }

    private static class AdminMonthAggregate {
        long totalOrders = 0;
        long completedOrders = 0;
        long cancelledOrders = 0;
        long returnedOrders = 0;
        long newCustomers = 0;
        long newSellers = 0;
        BigDecimal gmv = BigDecimal.ZERO;
        BigDecimal refundAmount = BigDecimal.ZERO;
    }

    private static class MethodAgg {
        long count = 0;
        BigDecimal total = BigDecimal.ZERO;
    }
}
