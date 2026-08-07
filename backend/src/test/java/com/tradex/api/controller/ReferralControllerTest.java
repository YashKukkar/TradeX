package com.tradex.api.controller;

import com.tradex.api.security.JwtAuthenticationFilter;
import com.tradex.api.security.JwtUtil;
import com.tradex.api.security.SecurityConfig;
import com.tradex.api.service.ReferralService;
import com.tradex.api.service.SystemSettingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tradex.api.config.JacksonConfig;

@WebMvcTest(ReferralController.class)
@Import({ SecurityConfig.class, JwtAuthenticationFilter.class, JacksonConfig.class })
@AutoConfigureMockMvc(addFilters = false)
class ReferralControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReferralService referralService;

    @MockitoBean
    private SystemSettingService systemSettingService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private com.tradex.api.security.TokenBlacklistCache tokenBlacklistCache;

    @MockitoBean
    private com.tradex.api.repository.UserRepository userRepository;

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetMyReferrals() throws Exception {
        when(referralService.getMyReferrals("test@example.com")).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/referrals/downline")
                .principal(new UsernamePasswordAuthenticationToken("test@example.com", "password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetMyTransactions() throws Exception {
        when(referralService.getMyTransactions("test@example.com")).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/referrals/transactions")
                .principal(new UsernamePasswordAuthenticationToken("test@example.com", "password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/referrals/downline"))
                .andExpect(status().isUnauthorized());
    }
}
