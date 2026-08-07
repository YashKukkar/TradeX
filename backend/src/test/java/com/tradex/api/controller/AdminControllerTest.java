package com.tradex.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradex.api.dto.AdminAdjustPointsRequest;
import com.tradex.api.dto.AdminAuditLogDTO;
import com.tradex.api.dto.PointsTransactionDTO;
import com.tradex.api.dto.SystemSettingDTO;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.enums.AdminAction;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.security.JwtAuthenticationFilter;
import com.tradex.api.security.JwtUtil;
import com.tradex.api.security.SecurityConfig;
import com.tradex.api.security.TokenBlacklistCache;
import com.tradex.api.service.AdminUserService;
import com.tradex.api.service.ReferralService;
import com.tradex.api.service.seed.SeedDataService;
import com.tradex.api.service.SystemSettingService;
import com.tradex.api.service.UserService;
import com.tradex.api.service.WalletService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.tradex.api.config.JacksonConfig;

@WebMvcTest(AdminController.class)
@Import({ SecurityConfig.class, JwtAuthenticationFilter.class, JacksonConfig.class })
@AutoConfigureMockMvc(addFilters = false)

class AdminControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private UserService userService;

        @MockitoBean
        private SystemSettingService systemSettingService;

        @MockitoBean
        private ReferralService referralService;

        @MockitoBean
        private SeedDataService seedDataService;

        @MockitoBean
        private JwtUtil jwtUtil;

        @MockitoBean
        private UserRepository userRepository;

        @MockitoBean
        private AdminUserService adminUserService;

        @MockitoBean
        private WalletService walletService;

        @MockitoBean
        private TokenBlacklistCache tokenBlacklistCache;

        @MockitoBean(name = "walletSecurity")
        private com.tradex.api.security.WalletSecurityEvaluator walletSecurity;

        @Autowired
        private ObjectMapper objectMapper;

        @BeforeEach
        void setUp() {
                lenient().when(walletSecurity.canManageTransaction(any())).thenReturn(true);
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testGetAllUsers() throws Exception {
                UserDTO user = new UserDTO(1L, "test@example.com", "CODE", 100L, ".1.", null, "+1234567890");
                when(userService.getAllUsers(any())).thenReturn(List.of(user));

                mockMvc.perform(get("/api/admin/users")
                                .principal(new UsernamePasswordAuthenticationToken("admin@example.com", "password")))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].email").value("test@example.com"));
        }

        @Test
        @WithMockUser(username = "user@example.com", authorities = "ROLE_USER")
        void testUnauthorizedAccess() throws Exception {
                mockMvc.perform(get("/api/admin/users"))
                                .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testGetUserById() throws Exception {
                UserDTO user = new UserDTO(2L, "test@example.com", "CODE", 100L, ".1.2.", null, "+1234567890");
                when(userService.getUserById(eq(2L), any())).thenReturn(user);

                mockMvc.perform(get("/api/admin/users/2")
                                .principal(new UsernamePasswordAuthenticationToken("admin@example.com", "password")))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.email").value("test@example.com"));
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testUpdateUserStatus() throws Exception {
                UserDTO user = new UserDTO(2L, "test@example.com", "CODE", 100L, ".1.2.", null, "+1234567890");
                when(adminUserService.lockUser("admin@example.com", 2L)).thenReturn(user);

                AdminController.StatusActionRequest request = new AdminController.StatusActionRequest(AdminAction.LOCK);

                mockMvc.perform(patch("/api/admin/users/2/status")
                                .principal(new UsernamePasswordAuthenticationToken("admin@example.com", "password"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.email").value("test@example.com"));

                verify(adminUserService).lockUser("admin@example.com", 2L);
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testSendPasswordResetEmail() throws Exception {
                mockMvc.perform(post("/api/admin/users/2/reset-password")
                                .principal(new UsernamePasswordAuthenticationToken("admin@example.com", "password")))
                                .andExpect(status().isOk());

                verify(adminUserService).sendPasswordResetEmail("admin@example.com", 2L);
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testAdjustPoints() throws Exception {
                UserDTO user = new UserDTO(2L, "test@example.com", "CODE", 150L, ".1.2.", null, "+1234567890");
                AdminAdjustPointsRequest request = new AdminAdjustPointsRequest(50L, "Bonus");

                when(adminUserService.adjustPoints(eq("admin@example.com"), eq(2L),
                                any(AdminAdjustPointsRequest.class)))
                                .thenReturn(user);

                mockMvc.perform(post("/api/admin/users/2/points")
                                .principal(new UsernamePasswordAuthenticationToken("admin@example.com", "password"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.pointsBalance").value(150));
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testGetAuditLogs() throws Exception {
                AdminAuditLogDTO logDTO = new AdminAuditLogDTO(1L, "admin@example.com", "user@example.com", "LOCK",
                                "Details",
                                System.currentTimeMillis() / 1000);
                Page<AdminAuditLogDTO> page = new PageImpl<>(List.of(logDTO));

                when(adminUserService.getAuditLogs(any(), any(Pageable.class))).thenReturn(page);

                mockMvc.perform(get("/api/admin/audit-logs"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].actorEmail").value("admin@example.com"));
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testGetUserPointsHistory() throws Exception {
                PointsTransactionDTO tx = new PointsTransactionDTO(1L, 100L, 200L, "ADMIN_ADJUSTMENT", "Notes",
                                1783200000L);
                when(adminUserService.getUserPointsHistory(2L)).thenReturn(List.of(tx));

                mockMvc.perform(get("/api/admin/users/2/points-history"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].amount").value(100));
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testGetUserWalletHistory() throws Exception {
                WalletTransactionDTO tx = new WalletTransactionDTO(
                                1L,
                                BigDecimal.TEN,
                                BigDecimal.TEN,
                                "DEPOSIT",
                                "SUCCESS",
                                "Notes",
                                System.currentTimeMillis() / 1000,
                                "user@example.com",
                                "+1234567890",
                                "ACC12345");
                when(adminUserService.getUserWalletHistory(2L)).thenReturn(List.of(tx));

                mockMvc.perform(get("/api/admin/users/2/wallet-history"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].amount").value(10));
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testGetReferralTree() throws Exception {
                UserDTO user = new UserDTO(2L, "tree@example.com", "CODE", 100L, ".1.2.", "test@example.com",
                                "+1234567890");
                when(referralService.getReferralTree(1L)).thenReturn(List.of(user));

                mockMvc.perform(get("/api/admin/users/1/referral-tree"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].email").value("tree@example.com"));
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testGetSettings() throws Exception {
                SystemSettingDTO dto = new SystemSettingDTO(
                                new SystemSettingDTO.WelcomeSettings(true, 1000L),
                                new SystemSettingDTO.ReferralSettings(true, 500L, 200L, 100L, true, 50L, 3),
                                new SystemSettingDTO.VerificationSettings(false, false),
                                new SystemSettingDTO.DepositRewardSettings(true, new java.math.BigDecimal("100.00"),
                                                new java.math.BigDecimal("500.00")),
                                new SystemSettingDTO.PointsConversionSettings(true, new java.math.BigDecimal("10.00")),
                                new SystemSettingDTO.EmailSettings("smtp.gmail.com", 587, "", "", "noreply@tradex.com",
                                                "TradeX",
                                                false),
                                new SystemSettingDTO.GeneralSettings("Asia/Kolkata", "INR"));
                when(systemSettingService.getSettingsDTO()).thenReturn(dto);

                mockMvc.perform(get("/api/admin/settings"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.welcomeCoinsAmount").value(1000));
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testUpdateSettings() throws Exception {
                SystemSettingDTO dto = new SystemSettingDTO(
                                new SystemSettingDTO.WelcomeSettings(true, 2000L),
                                new SystemSettingDTO.ReferralSettings(true, 500L, 200L, 100L, true, 50L, 3),
                                new SystemSettingDTO.VerificationSettings(false, false),
                                new SystemSettingDTO.DepositRewardSettings(true, new java.math.BigDecimal("100.00"),
                                                new java.math.BigDecimal("500.00")),
                                new SystemSettingDTO.PointsConversionSettings(true, new java.math.BigDecimal("10.00")),
                                new SystemSettingDTO.EmailSettings("smtp.gmail.com", 587, "", "", "noreply@tradex.com",
                                                "TradeX",
                                                false),
                                new SystemSettingDTO.GeneralSettings("Asia/Kolkata", "INR"));
                when(systemSettingService.updateSettings(any(SystemSettingDTO.class))).thenReturn(dto);

                mockMvc.perform(put("/api/admin/settings")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(dto)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.welcomeCoinsAmount").value(2000));
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testSeedTestData() throws Exception {
                mockMvc.perform(post("/api/admin/seed-test-data"))
                                .andExpect(status().isOk());

                verify(seedDataService).seedTestData();
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testGetAllTransactions() throws Exception {
                WalletTransactionDTO tx = new WalletTransactionDTO(
                                1L,
                                BigDecimal.TEN,
                                BigDecimal.TEN,
                                "DEPOSIT",
                                "PENDING",
                                "Notes",
                                System.currentTimeMillis() / 1000,
                                "user@example.com",
                                "+1234567890",
                                "ACC12345");
                when(walletService.getAllTransactions()).thenReturn(List.of(tx));

                mockMvc.perform(get("/api/admin/transactions"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].amount").value(10));
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testGetPendingTransactions() throws Exception {
                WalletTransactionDTO tx = new WalletTransactionDTO(
                                1L,
                                BigDecimal.TEN,
                                BigDecimal.TEN,
                                "DEPOSIT",
                                "PENDING",
                                "Notes",
                                System.currentTimeMillis() / 1000,
                                "user@example.com",
                                "+1234567890",
                                "ACC12345");
                when(walletService.getPendingTransactions()).thenReturn(List.of(tx));

                mockMvc.perform(get("/api/admin/transactions/pending"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].amount").value(10));
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testApproveTransaction() throws Exception {
                WalletTransactionDTO tx = new WalletTransactionDTO(
                                1L,
                                BigDecimal.TEN,
                                BigDecimal.TEN,
                                "DEPOSIT",
                                "SUCCESS",
                                "Notes",
                                System.currentTimeMillis() / 1000,
                                "user@example.com",
                                "+1234567890",
                                "ACC12345");
                when(walletService.approveTransaction(eq(1L))).thenReturn(tx);

                mockMvc.perform(post("/api/admin/transactions/1/approve"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("SUCCESS"));
        }

        @Test
        @WithMockUser(username = "admin@example.com", authorities = "ROLE_SUPER_ADMIN")
        void testRejectTransaction() throws Exception {
                WalletTransactionDTO tx = new WalletTransactionDTO(
                                1L,
                                BigDecimal.TEN,
                                BigDecimal.TEN,
                                "DEPOSIT",
                                "FAILED",
                                "Notes",
                                System.currentTimeMillis() / 1000,
                                "user@example.com",
                                "+1234567890",
                                "ACC12345");
                AdminController.RejectTransactionRequest request = new AdminController.RejectTransactionRequest(
                                "Invalid receipt");

                when(walletService.rejectTransaction(eq(1L), eq("Invalid receipt"))).thenReturn(tx);

                mockMvc.perform(post("/api/admin/transactions/1/reject")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("FAILED"));
        }
}
