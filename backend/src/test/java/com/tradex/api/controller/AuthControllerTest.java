package com.tradex.api.controller;

import com.tradex.api.dto.AuthRequest;
import com.tradex.api.dto.SignupRequest;
import com.tradex.api.entity.User;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.VerificationTokenRepository;
import com.tradex.api.repository.SystemSettingRepository;
import com.tradex.api.service.SystemSettingService;
import com.tradex.api.entity.VerificationToken;
import com.tradex.api.entity.SystemSetting;
import com.tradex.api.enums.VerificationType;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.security.test.context.support.WithMockUser;

import org.hamcrest.Matchers;

@SpringBootTest
@AutoConfigureMockMvc
@SuppressWarnings("null")
@Transactional // Rolls back database after each test
class AuthControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @Autowired
        private ObjectMapper objectMapper;

        @Autowired
        private VerificationTokenRepository verificationTokenRepository;

        @Autowired
        private SystemSettingRepository systemSettingRepository;

        @Autowired
        private SystemSettingService systemSettingService;

        private String hashOtp(String otp) {
                try {
                        java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                        byte[] hash = digest.digest(otp.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                        return java.util.HexFormat.of().formatHex(hash);
                } catch (Exception e) {
                        throw new RuntimeException(e);
                }
        }

        @BeforeEach
        void setup() {
                verificationTokenRepository.deleteAll();
                userRepository.deleteAll();
        }

        @Test
        void testSignupSuccess() throws Exception {
                SignupRequest request = new SignupRequest("newuser@example.com", "securePassword", null, "+1234567890",
                                "ACC12345678");

                mockMvc.perform(post("/api/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").exists())
                                .andExpect(jsonPath("$.email").value("newuser@example.com"));
        }

        @Test
        void testSignupSuccessWithoutAccountNumber() throws Exception {
                SignupRequest request = new SignupRequest("newuser_nobank@example.com", "securePassword", null,
                                "+1234567890", null);
                // accountNumber is omitted

                mockMvc.perform(post("/api/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").exists())
                                .andExpect(jsonPath("$.email").value("newuser_nobank@example.com"));
        }

        @Test
        void testSignupEmailAlreadyTaken() throws Exception {
                User existingUser = new User("taken@example.com", passwordEncoder.encode("password123"));
                userRepository.save(existingUser);

                SignupRequest request = new SignupRequest("taken@example.com", "password123", null, "+1234567890",
                                "ACC12345678");

                mockMvc.perform(post("/api/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.message").value("Email is already taken"));
        }

        @Test
        void testSignupInvalidPhoneNumber() throws Exception {
                SignupRequest request = new SignupRequest("newuser@example.com", "securePassword", null, "12345",
                                "ACC12345678");

                mockMvc.perform(post("/api/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message",
                                                Matchers.containsString(
                                                                "Phone number must contain between 10 and 15 digits")));
        }

        @Test
        void testSignupInvalidAccountNumber() throws Exception {
                SignupRequest request = new SignupRequest("newuser@example.com", "securePassword", null, "+1234567890",
                                "acc_123");

                mockMvc.perform(post("/api/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message",
                                                Matchers.containsString(
                                                                "Account number must be between 8 and 20 characters long")));
        }

        @Test
        void testLoginSuccess() throws Exception {
                User existingUser = new User("login@example.com", passwordEncoder.encode("mypassword"));
                userRepository.save(existingUser);

                AuthRequest request = new AuthRequest("login@example.com", "mypassword");

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").exists());
        }

        @Test
        void testLoginInvalidPassword() throws Exception {
                User existingUser = new User("login@example.com", passwordEncoder.encode("mypassword"));
                userRepository.save(existingUser);

                AuthRequest request = new AuthRequest("login@example.com", "wrongpassword");

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.message").value("Invalid email or password"));
        }

        @Test
        void testLogout() throws Exception {
                mockMvc.perform(post("/api/auth/logout"))
                                .andExpect(status().isOk())
                                .andExpect(header().exists(org.springframework.http.HttpHeaders.SET_COOKIE));
        }

        @Test
        @WithMockUser(username = "login@example.com")
        void testVerifyEmailSuccess() throws Exception {
                User existingUser = new User("login@example.com", passwordEncoder.encode("mypassword"));
                existingUser.setEmailVerified(false);
                existingUser = userRepository.save(existingUser);

                verificationTokenRepository.save(
                                new VerificationToken(existingUser, hashOtp("123456"),
                                                VerificationType.EMAIL,
                                                java.time.LocalDateTime.now().plusMinutes(10)));

                mockMvc.perform(post("/api/auth/verify-email")
                                .param("code", "123456"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.emailVerified").value(true));
        }

        @Test
        @WithMockUser(username = "login@example.com")
        void testVerifyEmailFailureInvalidCode() throws Exception {
                User existingUser = new User("login@example.com", passwordEncoder.encode("mypassword"));
                existingUser.setEmailVerified(false);
                existingUser = userRepository.save(existingUser);

                verificationTokenRepository.save(
                                new VerificationToken(existingUser, hashOtp("123456"),
                                                VerificationType.EMAIL,
                                                java.time.LocalDateTime.now().plusMinutes(10)));

                mockMvc.perform(post("/api/auth/verify-email")
                                .param("code", "wrongcode"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Invalid verification code"));
        }

        @Test
        @WithMockUser(username = "login@example.com")
        void testVerifyPhoneSuccess() throws Exception {
                User existingUser = new User("login@example.com", passwordEncoder.encode("mypassword"));
                existingUser.setPhoneNumber("+1234567890");
                existingUser.setPhoneVerified(false);
                existingUser = userRepository.save(existingUser);

                verificationTokenRepository.save(
                                new VerificationToken(existingUser, hashOtp("123456"),
                                                VerificationType.PHONE,
                                                java.time.LocalDateTime.now().plusMinutes(10)));

                mockMvc.perform(post("/api/auth/verify-phone")
                                .param("code", "123456"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.phoneVerified").value(true));
        }

        @Test
        @WithMockUser(username = "login@example.com")
        void testVerifyPhoneFailureNoPhone() throws Exception {
                User existingUser = new User("login@example.com", passwordEncoder.encode("mypassword"));
                existingUser.setPhoneNumber(null);
                existingUser.setPhoneVerified(false);
                existingUser = userRepository.save(existingUser);

                mockMvc.perform(post("/api/auth/verify-phone")
                                .param("code", "123456"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("No phone number associated with this account"));
        }

        @Test
        @WithMockUser(username = "login@example.com")
        void testResendOtpSuccess() throws Exception {
                User existingUser = new User("login@example.com", passwordEncoder.encode("mypassword"));
                existingUser.setEmailVerified(false);
                userRepository.save(existingUser);

                mockMvc.perform(post("/api/auth/resend-otp")
                                .param("type", "EMAIL"))
                                .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "login@example.com")
        void testResendOtpCooldown() throws Exception {
                User existingUser = new User("login@example.com", passwordEncoder.encode("mypassword"));
                existingUser.setEmailVerified(false);
                userRepository.save(existingUser);

                // First resend: Success
                mockMvc.perform(post("/api/auth/resend-otp")
                                .param("type", "EMAIL"))
                                .andExpect(status().isOk());

                // Second resend (cooldown)
                mockMvc.perform(post("/api/auth/resend-otp")
                                .param("type", "EMAIL"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value(
                                                "Please wait at least 60 seconds before requesting a new verification code"));
        }

        @Test
        void testGetPublicSettings() throws Exception {
                SystemSetting settings = systemSettingRepository.findById(1L).orElseGet(() -> {
                        SystemSetting s = new SystemSetting();
                        s.setId(1L);
                        return s;
                });
                settings.setPointsToCashConversionRate(new BigDecimal("15.0000"));
                settings.setFirstDepositRewardAmount(new BigDecimal("120.0000"));
                settings.setFirstDepositRewardThreshold(new BigDecimal("600.0000"));
                systemSettingRepository.save(settings);
                systemSettingService.refreshCache();

                mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .get("/api/auth/settings"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.welcomeCoinsEnabled").exists())
                                .andExpect(jsonPath("$.pointsToCashConversionRate").value(15.0))
                                .andExpect(jsonPath("$.firstDepositRewardAmount").value(120.0))
                                .andExpect(jsonPath("$.firstDepositRewardThreshold").value(600.0));
        }

        @Test
        void testResetPasswordSuccess() throws Exception {
                User user = new User("reset@example.com", passwordEncoder.encode("oldpassword"));
                user.setEmailVerified(true);
                user.setCredentialsExpired(true);
                userRepository.save(user);

                java.time.LocalDateTime expiry = java.time.LocalDateTime.now().plusMinutes(10);
                VerificationToken token = new VerificationToken(user, hashOtp("123456"), VerificationType.PASSWORD_RESET, expiry);
                verificationTokenRepository.save(token);

                AuthController.ResetPasswordRequest request = new AuthController.ResetPasswordRequest(
                        "reset@example.com",
                        "123456",
                        "newsecurepassword"
                );

                mockMvc.perform(post("/api/auth/reset-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());

                User updatedUser = userRepository.findByEmail("reset@example.com").orElseThrow();
                org.junit.jupiter.api.Assertions.assertFalse(updatedUser.isCredentialsExpired());
                org.junit.jupiter.api.Assertions.assertTrue(passwordEncoder.matches("newsecurepassword", updatedUser.getPassword()));
        }
}
