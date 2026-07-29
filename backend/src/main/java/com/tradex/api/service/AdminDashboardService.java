package com.tradex.api.service;

import com.tradex.api.dto.AdminDashboardMetricsDTO;
import com.tradex.api.dto.AdminDashboardMetricsDTO.EmployeeMetricsDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserAnalyticsService userAnalyticsService;
    private final TransactionAnalyticsService transactionAnalyticsService;
    private final TicketAnalyticsService ticketAnalyticsService;
    private final EmployeeAnalyticsService employeeAnalyticsService;

    @Transactional(readOnly = true)
    public AdminDashboardMetricsDTO getDashboardMetrics(LocalDateTime start, LocalDateTime end) {
        UserAnalyticsService.UserAnalytics userResult = userAnalyticsService.getUserAnalytics(start, end);
        TransactionAnalyticsService.TransactionAnalytics transactionResult = transactionAnalyticsService.getTransactionAnalytics(start, end);
        TicketAnalyticsService.TicketAnalytics ticketResult = ticketAnalyticsService.getTicketAnalytics(start, end);
        List<EmployeeMetricsDTO> employeeResult = employeeAnalyticsService.getEmployeePerformance(start, end);

        return new AdminDashboardMetricsDTO(
            userResult.totalUsers(),
            userResult.newRegistrations(),
            transactionResult.totalDeposits(),
            transactionResult.totalDepositsCount(),
            transactionResult.totalWithdrawals(),
            transactionResult.totalWithdrawalsCount(),
            ticketResult.openTickets(),
            ticketResult.resolvedTickets(),
            transactionResult.pendingDepositsCount(),
            transactionResult.pendingDepositsAmount(),
            transactionResult.pendingWithdrawalsCount(),
            transactionResult.pendingWithdrawalsAmount(),
            employeeResult
        );
    }
}
