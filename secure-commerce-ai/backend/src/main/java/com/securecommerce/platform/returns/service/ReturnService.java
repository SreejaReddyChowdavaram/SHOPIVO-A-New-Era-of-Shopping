package com.securecommerce.platform.returns.service;

import com.securecommerce.platform.returns.dto.*;
import com.securecommerce.platform.user.entity.User;

import java.util.List;

public interface ReturnService {

    ReturnEligibilityResponse checkEligibility(Long orderId, Long orderItemId, User customer);

    ReturnResponse requestReturn(CreateReturnRequest request, User customer);

    ReturnResponse processAdminApproval(Long returnId, User customer);

    default ReturnResponse processSandboxApproval(Long returnId, User customer) {
        return processAdminApproval(returnId, customer);
    }

    List<ReturnResponse> getMyReturns(User customer);

    List<RefundResponse> getMyRefunds(User customer);

    ReturnResponse getReturnById(Long id, User customer);

    ReturnResponse cancelReturn(Long id, User customer);
}
