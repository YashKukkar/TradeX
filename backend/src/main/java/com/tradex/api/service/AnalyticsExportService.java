package com.tradex.api.service;

import com.tradex.api.dto.AdminDashboardMetricsDTO;
import com.tradex.api.dto.AdminDashboardMetricsDTO.EmployeeMetricsDTO;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class AnalyticsExportService {

    private static final DateTimeFormatter DISPLAY_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public byte[] generateAnalyticsCsv(
            AdminDashboardMetricsDTO metrics,
            LocalDateTime start,
            LocalDateTime end,
            LocalDateTime dataCutoff,
            LocalDateTime asOfNow) {

        StringBuilder sb = new StringBuilder();

        boolean isCurrentPeriod = end.isAfter(asOfNow) || dataCutoff.isAfter(asOfNow.minusMinutes(1));
        String periodStatus = isCurrentPeriod ? "OPEN / IN-PROGRESS (Snapshot)" : "CLOSED HISTORICAL PERIOD";

        // Report Audit & Cutoff Metadata Section
        sb.append("Report Title,TradeX Analytics Telemetry Report\n");
        sb.append("Generated On,").append(escapeCsv(asOfNow.format(DISPLAY_DATE_FORMATTER))).append("\n");
        sb.append("Requested Date Range,")
                .append(escapeCsv(start.format(DISPLAY_DATE_FORMATTER) + " to " + end.format(DISPLAY_DATE_FORMATTER)))
                .append("\n");
        sb.append("Data Cutoff Time (As Of),").append(escapeCsv(dataCutoff.format(DISPLAY_DATE_FORMATTER)))
                .append("\n");
        sb.append("Period Status,").append(escapeCsv(periodStatus)).append("\n\n");

        // Summary Metrics Section
        sb.append("[ SUMMARY METRICS ]\n");
        sb.append("Metric,Value\n");
        sb.append("Total Registered Users,").append(metrics.totalUsers()).append("\n");
        sb.append("New Registrations,").append(metrics.newRegistrations()).append("\n");
        sb.append("Total Deposits Amount,").append(formatDecimal(metrics.totalDeposits())).append("\n");
        sb.append("Total Deposits Count,").append(metrics.totalDepositsCount()).append("\n");
        sb.append("Total Withdrawals Amount,").append(formatDecimal(metrics.totalWithdrawals())).append("\n");
        sb.append("Total Withdrawals Count,").append(metrics.totalWithdrawalsCount()).append("\n");
        sb.append("Pending Deposits Count,").append(metrics.pendingDepositsCount()).append("\n");
        sb.append("Pending Deposits Amount,").append(formatDecimal(metrics.pendingDepositsAmount())).append("\n");
        sb.append("Pending Withdrawals Count,").append(metrics.pendingWithdrawalsCount()).append("\n");
        sb.append("Pending Withdrawals Amount,").append(formatDecimal(metrics.pendingWithdrawalsAmount())).append("\n");
        sb.append("Open Tickets,").append(metrics.openTickets()).append("\n");
        sb.append("Resolved Tickets,").append(metrics.resolvedTickets()).append("\n\n");

        // Employee Performance Section
        sb.append("[ EMPLOYEE PERFORMANCE ]\n");
        sb.append(
                "Employee ID,Email,Tickets Resolved,Tickets Pending,Deposit Approvals,Withdrawal Approvals,Avg Ticket Resolution Time (s),Avg Tx Processing Time (s),Permissions\n");

        List<EmployeeMetricsDTO> employees = metrics.employeePerformance();
        if (employees != null && !employees.isEmpty()) {
            for (EmployeeMetricsDTO emp : employees) {
                sb.append(emp.employeeId() != null ? emp.employeeId() : "").append(",");
                sb.append(escapeCsv(emp.email())).append(",");
                sb.append(emp.ticketsResolved()).append(",");
                sb.append(emp.ticketsPending()).append(",");
                sb.append(emp.depositApprovals()).append(",");
                sb.append(emp.withdrawalApprovals()).append(",");
                sb.append(emp.avgTicketResolutionTimeSeconds()).append(",");
                sb.append(emp.avgTxProcessingTimeSeconds()).append(",");
                String permsStr = emp.permissions() != null ? String.join("; ", emp.permissions()) : "";
                sb.append(escapeCsv(permsStr)).append("\n");
            }
        } else {
            sb.append("No employee activity recorded for this period,,,,,,,,\n");
        }

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            baos.write(0xEF);
            baos.write(0xBB);
            baos.write(0xBF);
            baos.write(sb.toString().getBytes(StandardCharsets.UTF_8));
            return baos.toByteArray();
        } catch (IOException e) {
            return sb.toString().getBytes(StandardCharsets.UTF_8);
        }
    }

    private String formatDecimal(BigDecimal amount) {
        if (amount == null) {
            return "0.00";
        }
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        // Neutralize potential CSV injection formula triggers for Google Sheets & Excel
        if (value.startsWith("=") || value.startsWith("+") || value.startsWith("-") || value.startsWith("@")) {
            value = "\t" + value;
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            value = "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
