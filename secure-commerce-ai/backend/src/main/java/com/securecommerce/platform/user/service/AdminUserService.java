package com.securecommerce.platform.user.service;

import com.securecommerce.platform.user.dto.*;
import com.securecommerce.platform.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminUserService {

    Page<AdminUserListItemResponse> getUsersPaged(
            User.Role role,
            Boolean enabled,
            String search,
            Pageable pageable
    );

    AdminUserDetailResponse getUserDetail(Long userId);

    Page<AdminSellerListItemResponse> getSellersPaged(
            Boolean enabled,
            String search,
            Pageable pageable
    );

    AdminSellerDetailResponse getSellerDetail(Long sellerId);

    AdminUserDetailResponse suspendUser(Long userId, User currentUser);

    AdminUserDetailResponse activateUser(Long userId, User currentUser);

    AdminUserSummaryMetricsResponse getUserMetrics();
}
