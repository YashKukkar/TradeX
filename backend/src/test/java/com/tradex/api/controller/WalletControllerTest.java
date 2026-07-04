package com.tradex.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.entity.User;
import com.tradex.api.enums.WalletTransactionStatus;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.security.JwtAuthenticationFilter;
import com.tradex.api.security.JwtUtil;
import com.tradex.api.security.SecurityConfig;
import com.tradex.api.service.WalletService;
import com.tradex.api.service.SystemSettingService;
import com.tradex.api.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WalletController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
@AutoConfigureMockMvc
@SuppressWarnings("null")
class WalletControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WalletService walletService;

    @MockBean
    private SystemSettingService systemSettingService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private com.tradex.api.security.TokenBlacklistCache tokenBlacklistCache;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "user@example.com", authorities = "ROLE_USER")
    void testDepositSuccess() throws Exception {
        WalletController.WalletAmountRequest request = new WalletController.WalletAmountRequest(BigDecimal.TEN);
        
        WalletTransactionDTO mockTx = new WalletTransactionDTO(
            1L,
            BigDecimal.TEN,
            BigDecimal.TEN,
            WalletTransactionType.DEPOSIT.name(),
            WalletTransactionStatus.PENDING.name(),
            "Notes",
            System.currentTimeMillis() / 1000,
            "user@example.com",
            "+1234567890",
            "ACC12345"
        );

        when(walletService.deposit(eq("user@example.com"), any(BigDecimal.class))).thenReturn(mockTx);

        mockMvc.perform(post("/api/wallet/deposit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(10))
                .andExpect(jsonPath("$.type").value("DEPOSIT"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser(username = "user@example.com", authorities = "ROLE_USER")
    void testWithdrawSuccess() throws Exception {
        WalletController.WalletAmountRequest request = new WalletController.WalletAmountRequest(BigDecimal.TEN);

        WalletTransactionDTO mockTx = new WalletTransactionDTO(
            2L,
            BigDecimal.TEN,
            BigDecimal.TEN,
            WalletTransactionType.WITHDRAWAL.name(),
            WalletTransactionStatus.PENDING.name(),
            "Notes",
            System.currentTimeMillis() / 1000,
            "user@example.com",
            "+1234567890",
            "ACC12345"
        );

        when(walletService.withdraw(eq("user@example.com"), any(BigDecimal.class))).thenReturn(mockTx);

        mockMvc.perform(post("/api/wallet/withdraw")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(10))
                .andExpect(jsonPath("$.type").value("WITHDRAWAL"));
    }

    @Test
    @WithMockUser(username = "user@example.com", authorities = "ROLE_USER")
    void testConvertPointsSuccess() throws Exception {
        WalletController.ConvertPointsRequest request = new WalletController.ConvertPointsRequest(100L);

        WalletTransactionDTO mockTx = new WalletTransactionDTO(
            3L,
            BigDecimal.TEN,
            BigDecimal.TEN,
            WalletTransactionType.POINTS_CONVERSION.name(),
            WalletTransactionStatus.SUCCESS.name(),
            "Notes",
            System.currentTimeMillis() / 1000,
            "user@example.com",
            "+1234567890",
            "ACC12345"
        );

        when(walletService.convertPoints(eq("user@example.com"), eq(100L))).thenReturn(mockTx);

        mockMvc.perform(post("/api/wallet/convert-points")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("POINTS_CONVERSION"))
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    @WithMockUser(username = "user@example.com", authorities = "ROLE_USER")
    void testGetMyTransactions() throws Exception {
        WalletTransactionDTO mockTx = new WalletTransactionDTO(
            1L,
            BigDecimal.TEN,
            BigDecimal.TEN,
            WalletTransactionType.DEPOSIT.name(),
            WalletTransactionStatus.SUCCESS.name(),
            "Notes",
            System.currentTimeMillis() / 1000,
            "user@example.com",
            "+1234567890",
            "ACC12345"
        );

        when(walletService.getMyWalletTransactions("user@example.com")).thenReturn(List.of(mockTx));

        mockMvc.perform(get("/api/wallet/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].amount").value(10))
                .andExpect(jsonPath("$[0].status").value("SUCCESS"));
    }

    @Test
    @WithMockUser(username = "user@example.com", authorities = "ROLE_USER")
    void testUpdateBankDetails() throws Exception {
        WalletController.BankDetailsRequest request = new WalletController.BankDetailsRequest("ACC12345");

        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setEmail("user@example.com");
        mockUser.setPointsBalance(100L);
        mockUser.setAccountNumber("ACC12345");

        when(walletService.updateBankDetails("user@example.com", "ACC12345")).thenReturn(mockUser);

        mockMvc.perform(put("/api/wallet/bank-details")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountNumber").value("ACC12345"));
    }
}
