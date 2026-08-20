package com.tradex.api.service;

import com.tradex.api.dto.AdminDashboardMetricsDTO;
import com.tradex.api.dto.AdminDashboardMetricsDTO.EmployeeMetricsDTO;
import com.tradex.api.util.CsvExportUtils;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnalyticsExportService {

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
        sb.append("Generated On,").append(CsvExportUtils.escapeCsv(CsvExportUtils.formatDate(asOfNow))).append("\n");
        sb.append("Requested Date Range,")
                .append(CsvExportUtils
                        .escapeCsv(CsvExportUtils.formatDate(start) + " to " + CsvExportUtils.formatDate(end)))
                .append("\n");
        sb.append("Data Cutoff Time (As Of),").append(CsvExportUtils.escapeCsv(CsvExportUtils.formatDate(dataCutoff)))
                .append("\n");
        sb.append("Period Status,").append(CsvExportUtils.escapeCsv(periodStatus)).append("\n\n");

        // Summary Metrics Section
        sb.append("[ SUMMARY METRICS ]\n");
        sb.append("Metric,Value\n");
        sb.append("Total Registered Users,").append(metrics.totalUsers()).append("\n");
        sb.append("New Registrations,").append(metrics.newRegistrations()).append("\n");
        sb.append("Total Deposits Amount,").append(CsvExportUtils.formatDecimal(metrics.totalDeposits())).append("\n");
        sb.append("Total Deposits Count,").append(metrics.totalDepositsCount()).append("\n");
        sb.append("Total Withdrawals Amount,").append(CsvExportUtils.formatDecimal(metrics.totalWithdrawals()))
                .append("\n");
        sb.append("Total Withdrawals Count,").append(metrics.totalWithdrawalsCount()).append("\n");

        BigDecimal netVolume = (metrics.totalDeposits() != null ? metrics.totalDeposits() : BigDecimal.ZERO)
                .subtract(metrics.totalWithdrawals() != null ? metrics.totalWithdrawals() : BigDecimal.ZERO);
        sb.append("Net Financial Volume,").append(CsvExportUtils.formatDecimal(netVolume)).append("\n");

        sb.append("Pending Deposits Count,").append(metrics.pendingDepositsCount()).append("\n");
        sb.append("Pending Deposits Amount,").append(CsvExportUtils.formatDecimal(metrics.pendingDepositsAmount()))
                .append("\n");
        sb.append("Pending Withdrawals Count,").append(metrics.pendingWithdrawalsCount()).append("\n");
        sb.append("Pending Withdrawals Amount,")
                .append(CsvExportUtils.formatDecimal(metrics.pendingWithdrawalsAmount())).append("\n");
        sb.append("Open Tickets,").append(metrics.openTickets()).append("\n");
        sb.append("Resolved Tickets,").append(metrics.resolvedTickets()).append("\n");
        sb.append("Average Ticket Resolution (Hours),")
                .append(metrics.avgTicketResolutionHours() != null ? metrics.avgTicketResolutionHours() : 0.0)
                .append("\n\n");

        // Employee Performance Section
        sb.append("[ EMPLOYEE PERFORMANCE ]\n");
        sb.append(
                "Employee ID,Email,Tickets Resolved,Tickets Pending,Deposit Approvals,Withdrawal Approvals,Avg Ticket Resolution Time (s),Avg Ticket Resolution,Avg Tx Processing Time (s),Avg Tx Processing,Permissions\n");

        List<EmployeeMetricsDTO> employees = metrics.employeePerformance();
        if (employees != null && !employees.isEmpty()) {
            for (EmployeeMetricsDTO emp : employees) {
                sb.append(emp.employeeId() != null ? emp.employeeId() : "").append(",");
                sb.append(CsvExportUtils.escapeCsv(emp.email())).append(",");
                sb.append(emp.ticketsResolved()).append(",");
                sb.append(emp.ticketsPending()).append(",");
                sb.append(emp.depositApprovals()).append(",");
                sb.append(emp.withdrawalApprovals()).append(",");
                sb.append(emp.avgTicketResolutionTimeSeconds()).append(",");
                sb.append(CsvExportUtils.escapeCsv(formatDuration(emp.avgTicketResolutionTimeSeconds()))).append(",");
                sb.append(emp.avgTxProcessingTimeSeconds()).append(",");
                sb.append(CsvExportUtils.escapeCsv(formatDuration(emp.avgTxProcessingTimeSeconds()))).append(",");
                String permsStr = emp.permissions() != null ? String.join("; ", emp.permissions()) : "";
                sb.append(CsvExportUtils.escapeCsv(permsStr)).append("\n");
            }
        } else {
            sb.append("No employee activity recorded for this period,,,,,,,,,,\n");
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

    private String formatDuration(long seconds) {
        if (seconds <= 0)
            return "0s";
        long hrs = seconds / 3600;
        long mins = (seconds % 3600) / 60;
        long secs = seconds % 60;
        if (hrs > 0) {
            return String.format("%dh %dm", hrs, mins);
        } else if (mins > 0) {
            return String.format("%dm %ds", mins, secs);
        } else {
            return String.format("%ds", secs);
        }
    }
}
