package com.tradex.api.controller;

import com.tradex.api.dto.AdminDashboardMetricsDTO;
import com.tradex.api.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping("/metrics")
    public ResponseEntity<AdminDashboardMetricsDTO> getDashboardMetrics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        log.info("Super Admin requested dashboard metrics. startDate: {}, endDate: {}", startDate, endDate);

        // Default to Today if no parameters are specified
        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now();

        AdminDashboardMetricsDTO metrics = adminDashboardService.getDashboardMetrics(start, end);
        return ResponseEntity.ok(metrics);
    }
}
