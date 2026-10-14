package com.queueease.service;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class OrderServiceTest {
    @Test void blankRangeMeansAllPages() { assertEquals(24, OrderService.rangeCount("", 24)); }
    @Test void rangeIsCountedWithoutDuplicates() { assertEquals(9, OrderService.rangeCount("1-5, 8, 10-12", 24)); assertEquals(3, OrderService.rangeCount("1-3, 2", 10)); }
    @Test void invalidRangesAreRejected() {
        assertNull(OrderService.rangeCount("abc", 10));
        assertNull(OrderService.rangeCount("5-2", 10));
        assertNull(OrderService.rangeCount("1-50", 10));
    }
    @Test void fileSignaturesAreChecked() {
        assertTrue(OrderService.magicOk("pdf", "%PDF-1.7".getBytes()));
        assertFalse(OrderService.magicOk("pdf", "MZ..exe".getBytes()));
    }
}
