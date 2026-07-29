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
}

