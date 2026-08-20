package com.tradex.api.controller;

import com.tradex.api.dto.AdminDashboardMetricsDTO;
import com.tradex.api.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.tradex.api.service.AnalyticsExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.tradex.api.dto.AdminSystemHealthDTO;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final AnalyticsExportService analyticsExportService;

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping("/health")
    public ResponseEntity<AdminSystemHealthDTO> getSystemHealth() {
        return ResponseEntity.ok(adminDashboardService.getSystemHealth());
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping("/metrics")
    public ResponseEntity<AdminDashboardMetricsDTO> getDashboardMetrics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        log.info("Super Admin requested dashboard metrics. startDate: {}, endDate: {}", startDate, endDate);

        // Default to Today if no parameters are specified (normalized to second boundaries for cache hits)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = startDate != null ? startDate.withNano(0) : now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = endDate != null ? endDate.withNano(0) : now.withSecond(0).withNano(0);

        AdminDashboardMetricsDTO metrics = adminDashboardService.getDashboardMetrics(start, end);
        return ResponseEntity.ok(metrics);
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        LocalDateTime asOfNow = LocalDateTime.now();
        log.info("Super Admin requested analytics export. startDate: {}, endDate: {}, asOfNow: {}", startDate, endDate, asOfNow);

        LocalDateTime start = startDate != null ? startDate : asOfNow.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = endDate != null ? endDate : asOfNow;

        // Reject invalid date ranges where "From" date is after "To" date
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("Invalid date range: 'From' date cannot be after 'To' date.");
        }


        LocalDateTime dataCutoff = end.isAfter(asOfNow) ? asOfNow : end;

        AdminDashboardMetricsDTO metrics = adminDashboardService.getDashboardMetrics(start, dataCutoff);
        byte[] csvData = analyticsExportService.generateAnalyticsCsv(metrics, start, end, dataCutoff, asOfNow);

        String startStr = start.toLocalDate().toString();
        String endStr = dataCutoff.toLocalDate().toString();
        String timeStr = asOfNow.format(DateTimeFormatter.ofPattern("HH-mm-ss"));

        String filename;
        if (startStr.equals(endStr)) {
            filename = String.format("tradex-analytics-%s_asof_%s.csv", startStr, timeStr);
        } else {
            filename = String.format("tradex-analytics-%s_to_%s_asof_%s.csv", startStr, endStr, timeStr);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}



