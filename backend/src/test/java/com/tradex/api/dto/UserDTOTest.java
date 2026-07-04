package com.tradex.api.dto;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UserDTOTest {

    @Test
    void testUserDTOAccessors() {
        UserDTO dto = new UserDTO(
            1L, 
            "test@example.com", 
            "REF123", 
            100L, 
            ".1.", 
            "referrer@example.com", 
            "+1234567890", 
            "ACC12345", 
            "ADMIN", 
            123456789L, 
            true, 
            true,
            BigDecimal.TEN,
            BigDecimal.ONE,
            true,
            false
        );

        assertEquals(1L, dto.id());
        assertEquals("test@example.com", dto.email());
        assertEquals("REF123", dto.referralCode());
        assertEquals(100L, dto.pointsBalance());
        assertEquals(".1.", dto.referralPath());
        assertEquals("referrer@example.com", dto.referredByEmail());
        assertEquals("+1234567890", dto.phoneNumber());
        assertEquals("ACC12345", dto.accountNumber());
        assertEquals("ADMIN", dto.role());
        assertEquals(123456789L, dto.createdAt());
        assertTrue(dto.emailVerified());
        assertTrue(dto.phoneVerified());
        assertEquals(BigDecimal.TEN, dto.withdrawableBalance());
        assertEquals(BigDecimal.ONE, dto.bonusBalance());
        assertTrue(dto.enabled());
        assertFalse(dto.locked());
    }

    @Test
    void testUserDTOConstructors() {
        UserDTO dto1 = new UserDTO(1L, "t@example.com", "REF123", 100L, ".1.", "r@example.com", "+123", "ACC123");
        assertEquals("USER", dto1.role());
        assertNotNull(dto1.createdAt());
        assertEquals(BigDecimal.ZERO, dto1.withdrawableBalance());
        assertEquals(BigDecimal.ZERO, dto1.bonusBalance());

        UserDTO dto2 = new UserDTO(1L, "t@example.com", "REF123", 100L, ".1.", "r@example.com", "+123", "ACC123", "ADMIN", 999L);
        assertEquals("ADMIN", dto2.role());
        assertEquals(999L, dto2.createdAt());
        assertEquals(BigDecimal.ZERO, dto2.withdrawableBalance());
        assertEquals(BigDecimal.ZERO, dto2.bonusBalance());
    }
}

