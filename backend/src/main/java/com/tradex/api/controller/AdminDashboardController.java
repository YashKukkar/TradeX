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

import com.tradex.api.config.AppProperties;
import com.tradex.api.dto.AdminSystemHealthDTO;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final AnalyticsExportService analyticsExportService;
    private final AppProperties appProperties;

    @GetMapping("/health")
    public ResponseEntity<AdminSystemHealthDTO> getSystemHealth() {
        return ResponseEntity.ok(adminDashboardService.getSystemHealth());
    }

    @GetMapping("/metrics")
    public ResponseEntity<AdminDashboardMetricsDTO> getDashboardMetrics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        log.info("Super Admin requested dashboard metrics. startDate: {}, endDate: {}", startDate, endDate);

        // Default to Today if no parameters are specified (normalized to second
        // boundaries for cache hits)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = startDate != null ? startDate.withNano(0)
                : now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = endDate != null ? endDate.withNano(0) : now.withSecond(0).withNano(0);

        AdminDashboardMetricsDTO metrics = adminDashboardService.getDashboardMetrics(start, end);
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        LocalDateTime asOfNow = LocalDateTime.now();
        log.info("Super Admin requested analytics export. startDate: {}, endDate: {}, asOfNow: {}", startDate, endDate,
                asOfNow);

        LocalDateTime start = startDate != null ? startDate
                : asOfNow.withHour(0).withMinute(0).withSecond(0).withNano(0);
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

        String brandPrefix = appProperties.getBranding().getSanitizedAppName().toLowerCase();

        String filename;
        if (startStr.equals(endStr)) {
            filename = String.format("%s-analytics-%s_asof_%s.csv", brandPrefix, startStr, timeStr);
        } else {
            filename = String.format("%s-analytics-%s_to_%s_asof_%s.csv", brandPrefix, startStr, endStr, timeStr);
        }

        return com.tradex.api.util.CsvExportUtils.toResponseEntity(csvData, filename);
    }
}
