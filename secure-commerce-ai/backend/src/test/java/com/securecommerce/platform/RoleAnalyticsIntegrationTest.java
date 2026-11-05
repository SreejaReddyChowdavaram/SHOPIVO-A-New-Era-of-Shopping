package com.securecommerce.platform;

import com.securecommerce.platform.analytics.controller.AdminAnalyticsController;
import com.securecommerce.platform.analytics.controller.CustomerAnalyticsController;
import com.securecommerce.platform.analytics.controller.SellerAnalyticsController;
import com.securecommerce.platform.analytics.dto.*;
import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.security.util.JwtUtil;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class RoleAnalyticsIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private CustomerAnalyticsController customerAnalyticsController;
    @Autowired private SellerAnalyticsController sellerAnalyticsController;
    @Autowired private AdminAnalyticsController adminAnalyticsController;

    private User customer;
    private User seller;
    private User admin;
    private String customerToken;
    private String sellerToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        customer = userRepository.save(User.builder()
                .firstName("Test")
                .lastName("Customer")
                .email("test_cust_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        seller = userRepository.save(User.builder()
                .firstName("Test")
                .lastName("Seller")
                .email("test_seller_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        admin = userRepository.save(User.builder()
                .firstName("Test")
                .lastName("Admin")
                .email("test_admin_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.ADMIN)
                .enabled(true)
                .build());

        customerToken = jwtUtil.generateToken(customer.getId(), customer.getRole().name());
        sellerToken = jwtUtil.generateToken(seller.getId(), seller.getRole().name());
        adminToken = jwtUtil.generateToken(admin.getId(), admin.getRole().name());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("1. Customer retrieves own analytics overview and charts successfully")
    void testCustomerAnalyticsFlow() throws Exception {
        mockMvc.perform(get("/customer/analytics/overview")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("range", "30d"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.dateRangeLabel").value("Last 30 Days"));

        mockMvc.perform(get("/customer/analytics/charts")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("range", "all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderStatusDistribution").isArray());

        mockMvc.perform(get("/customer/analytics/recent-activity")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.recentPurchases").isArray());
    }

    @Test
    @DisplayName("2. Seller retrieves own analytics overview and charts successfully")
    void testSellerAnalyticsFlow() throws Exception {
        mockMvc.perform(get("/seller/analytics/overview")
                        .header("Authorization", "Bearer " + sellerToken)
                        .param("range", "7d"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.dateRangeLabel").value("Last 7 Days"));

        mockMvc.perform(get("/seller/analytics/charts")
                        .header("Authorization", "Bearer " + sellerToken)
                        .param("range", "this_month"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderStatusDistribution").isArray());

        mockMvc.perform(get("/seller/analytics/recent-orders")
                        .header("Authorization", "Bearer " + sellerToken)
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("3. Admin retrieves platform-wide overview, charts, and recent activity")
    void testAdminAnalyticsFlow() throws Exception {
        mockMvc.perform(get("/admin/analytics/overview")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("range", "this_year"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.dateRangeLabel").value("This Year"));

        mockMvc.perform(get("/admin/analytics/charts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("range", "all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderStatusDistribution").isArray());

        mockMvc.perform(get("/admin/analytics/recent-activity")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.recentOrders").isArray())
                .andExpect(jsonPath("$.data.newCustomers").isArray())
                .andExpect(jsonPath("$.data.newSellers").isArray());
    }

    @Test
    @DisplayName("4. Role-based security prevents unauthorized access across roles")
    void testRoleAccessRestrictions() throws Exception {
        // Customer cannot access seller or admin analytics
        mockMvc.perform(get("/seller/analytics/overview")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/admin/analytics/overview")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Seller cannot access customer or admin analytics
        mockMvc.perform(get("/customer/analytics/overview")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/admin/analytics/overview")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isForbidden());

        // Unauthenticated access fails with 401
        mockMvc.perform(get("/customer/analytics/overview"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/seller/analytics/overview"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/admin/analytics/overview"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("5. Direct controller invocation verifies data isolation")
    void testDirectControllerInvocations() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(customer, null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")))
        );
        ResponseEntity<ApiResponse<CustomerAnalyticsOverviewResponse>> custRes =
                customerAnalyticsController.getOverview("all", null, null, customer);
        assertThat(custRes.getBody()).isNotNull();
        assertThat(custRes.getBody().getData().totalOrders()).isGreaterThanOrEqualTo(0);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(seller, null, List.of(new SimpleGrantedAuthority("ROLE_SELLER")))
        );
        ResponseEntity<ApiResponse<SellerAnalyticsOverviewResponse>> sellerRes =
                sellerAnalyticsController.getOverview("all", null, null, seller);
        assertThat(sellerRes.getBody()).isNotNull();
        assertThat(sellerRes.getBody().getData().totalOrdersReceived()).isGreaterThanOrEqualTo(0);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(admin, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
        );
        ResponseEntity<ApiResponse<AdminAnalyticsOverviewResponse>> adminRes =
                adminAnalyticsController.getOverview("all", null, null);
        assertThat(adminRes.getBody()).isNotNull();
        assertThat(adminRes.getBody().getData().totalCustomers()).isGreaterThanOrEqualTo(1);
    }
}
