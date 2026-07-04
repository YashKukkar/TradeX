package com.tradex.api.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DataFormatterTest {

    @Test
    void testMaskEmail() {
        assertNull(DataFormatter.maskEmail(null));
        assertEquals("", DataFormatter.maskEmail(""));
        assertEquals("test", DataFormatter.maskEmail("test"));
        assertEquals("te***t@example.com", DataFormatter.maskEmail("test@example.com"));
        assertEquals("a***@example.com", DataFormatter.maskEmail("a@example.com"));
        assertEquals("a***@example.com", DataFormatter.maskEmail("ab@example.com"));
        assertEquals("ab***@example.com", DataFormatter.maskEmail("abc@example.com"));
        assertEquals("ab***d@example.com", DataFormatter.maskEmail("abcd@example.com"));
    }

    @Test
    void testMaskPhoneNumber() {
        assertNull(DataFormatter.maskPhoneNumber(null));
        assertEquals("******7890", DataFormatter.maskPhoneNumber("1234567890"));
    }

    @Test
    void testMaskAccountNumber() {
        assertNull(DataFormatter.maskAccountNumber(null));
        assertEquals("*******7890", DataFormatter.maskAccountNumber("B1234567890"));
    }
}

