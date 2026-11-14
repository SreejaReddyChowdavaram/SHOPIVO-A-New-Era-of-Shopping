package com.securecommerce.platform.user.service;

import com.securecommerce.platform.order.entity.OrderStatus;
import com.securecommerce.platform.order.repository.OrderItemRepository;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.user.dto.*;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

/**
 * AdminUserServiceImpl — Core administrative operations on platform accounts and seller profiles.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserListItemResponse> getUsersPaged(
            User.Role role, Boolean enabled, String search, Pageable pageable) {

        String trimmedSearch = search != null && !search.trim().isEmpty() ? search.trim() : null;
        String searchPattern = trimmedSearch != null ? "%" + trimmedSearch.toLowerCase() + "%" : null;

        Page<User> users = userRepository.findUsersWithFilters(role, enabled, searchPattern, pageable);
        return users.map(AdminUserListItemResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetail(Long userId) {
        User user = findUserById(userId);

        AdminUserDetailResponse.AdminSellerInfo sellerInfo = null;
        AdminUserDetailResponse.AdminCustomerInfo customerInfo = null;

        if (user.getRole() == User.Role.SELLER) {
            long totalProducts = productRepository.countBySellerId(userId);
            long approvedProducts = productRepository.countBySellerIdAndStatus(userId, Product.Status.APPROVED);
            long pendingProducts = productRepository.countBySellerIdAndStatus(userId, Product.Status.PENDING);
            long totalOrders = orderItemRepository.countTotalOrdersBySeller(userId, Instant.EPOCH);
            sellerInfo = new AdminUserDetailResponse.AdminSellerInfo(totalProducts, approvedProducts, pendingProducts, totalOrders);
        } else if (user.getRole() == User.Role.CUSTOMER) {
            long totalOrders = orderRepository.countByCustomerId(userId);
            customerInfo = new AdminUserDetailResponse.AdminCustomerInfo(totalOrders);
        }

        return AdminUserDetailResponse.from(user, sellerInfo, customerInfo);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminSellerListItemResponse> getSellersPaged(
            Boolean enabled, String search, Pageable pageable) {

        String trimmedSearch = search != null && !search.trim().isEmpty() ? search.trim() : null;
        String searchPattern = trimmedSearch != null ? "%" + trimmedSearch.toLowerCase() + "%" : null;

        Page<User> sellers = userRepository.findUsersWithFilters(User.Role.SELLER, enabled, searchPattern, pageable);

        return sellers.map(seller -> {
            long totalProducts = productRepository.countBySellerId(seller.getId());
            long totalOrders = orderItemRepository.countTotalOrdersBySeller(seller.getId(), Instant.EPOCH);
            return new AdminSellerListItemResponse(
                    seller.getId(),
                    seller.getFullName(),
                    seller.getEmail(),
                    seller.isEnabled() ? "ACTIVE" : "SUSPENDED",
                    seller.isEnabled(),
                    seller.getCreatedAt(),
                    totalProducts,
                    totalOrders
            );
        });
    }

    @Override
    @Transactional(readOnly = true)
    public AdminSellerDetailResponse getSellerDetail(Long sellerId) {
        User seller = findUserById(sellerId);
        if (seller.getRole() != User.Role.SELLER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Specified user is not a seller");
        }

        long totalProducts = productRepository.countBySellerId(sellerId);
        long pendingProducts = productRepository.countBySellerIdAndStatus(sellerId, Product.Status.PENDING);
        long approvedProducts = productRepository.countBySellerIdAndStatus(sellerId, Product.Status.APPROVED);
        long rejectedProducts = productRepository.countBySellerIdAndStatus(sellerId, Product.Status.REJECTED);

        long totalOrders = orderItemRepository.countTotalOrdersBySeller(sellerId, Instant.EPOCH);
        long completedOrders = orderItemRepository.countOrdersBySellerAndStatus(sellerId, OrderStatus.DELIVERED, Instant.EPOCH);
        long cancelledOrders = orderItemRepository.countOrdersBySellerAndStatus(sellerId, OrderStatus.CANCELLED, Instant.EPOCH);

        return new AdminSellerDetailResponse(
                seller.getId(),
                seller.getFullName(),
                seller.getEmail(),
                seller.isEnabled() ? "ACTIVE" : "SUSPENDED",
                seller.isEnabled(),
                seller.getCreatedAt(),
                totalProducts,
                pendingProducts,
                approvedProducts,
                rejectedProducts,
                totalOrders,
                completedOrders,
                cancelledOrders
        );
    }

    @Override
    @Transactional
    public AdminUserDetailResponse suspendUser(Long userId, User currentUser) {
        User targetUser = findUserById(userId);

        // Safeguard 1: Prevent self-suspension
        if (currentUser != null && currentUser.getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrators cannot suspend their own account");
        }

        // Safeguard 2: Prevent disabling the last active administrator
        if (targetUser.getRole() == User.Role.ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndEnabled(User.Role.ADMIN, true);
            if (activeAdminCount <= 1 && targetUser.isEnabled()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot suspend the last active administrator account");
            }
        }

        targetUser.setEnabled(false);
        userRepository.save(targetUser);

        log.info("ADMIN [{}] suspended user ID={} (email={}, role={}) at {}",
                currentUser != null ? currentUser.getEmail() : "SYSTEM",
                targetUser.getId(),
                targetUser.getEmail(),
                targetUser.getRole(),
                Instant.now());

        return getUserDetail(userId);
    }

    @Override
    @Transactional
    public AdminUserDetailResponse activateUser(Long userId, User currentUser) {
        User targetUser = findUserById(userId);

        targetUser.setEnabled(true);
        userRepository.save(targetUser);

        log.info("ADMIN [{}] activated user ID={} (email={}, role={}) at {}",
                currentUser != null ? currentUser.getEmail() : "SYSTEM",
                targetUser.getId(),
                targetUser.getEmail(),
                targetUser.getRole(),
                Instant.now());

        return getUserDetail(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserSummaryMetricsResponse getUserMetrics() {
        long totalUsers = userRepository.count();
        long totalCustomers = userRepository.countByRole(User.Role.CUSTOMER);
        long activeCustomers = userRepository.countByRoleAndEnabled(User.Role.CUSTOMER, true);
        long suspendedCustomers = userRepository.countByRoleAndEnabled(User.Role.CUSTOMER, false);

        long totalSellers = userRepository.countByRole(User.Role.SELLER);
        long activeSellers = userRepository.countByRoleAndEnabled(User.Role.SELLER, true);
        long suspendedSellers = userRepository.countByRoleAndEnabled(User.Role.SELLER, false);

        long suspendedUsers = userRepository.countByEnabled(false);

        return new AdminUserSummaryMetricsResponse(
                totalUsers,
                totalCustomers,
                activeCustomers,
                suspendedCustomers,
                totalSellers,
                activeSellers,
                suspendedSellers,
                suspendedUsers
        );
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + userId));
    }
}
