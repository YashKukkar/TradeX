package com.tradex.api.controller;

import com.tradex.api.security.JwtAuthenticationFilter;
import com.tradex.api.security.JwtUtil;
import com.tradex.api.security.SecurityConfig;
import com.tradex.api.service.ReferralService;
import com.tradex.api.service.SystemSettingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReferralController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
@AutoConfigureMockMvc
class ReferralControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReferralService referralService;

    @MockBean
    private SystemSettingService systemSettingService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private com.tradex.api.security.TokenBlacklistCache tokenBlacklistCache;

    @MockBean
    private com.tradex.api.repository.UserRepository userRepository;

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetMyReferrals() throws Exception {
        when(referralService.getMyReferrals("test@example.com")).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/referrals/downline"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetMyTransactions() throws Exception {
        when(referralService.getMyTransactions("test@example.com")).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/referrals/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/referrals/downline"))
                .andExpect(status().isUnauthorized()); 
    }
}

