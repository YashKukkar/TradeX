package com.tradex.api.service;

import com.tradex.api.dto.AdminDashboardMetricsDTO;
import com.tradex.api.dto.AdminDashboardMetricsDTO.EmployeeMetricsDTO;
import com.tradex.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import com.tradex.api.dto.AdminSystemHealthDTO;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final UserAnalyticsService userAnalyticsService;
    private final TransactionAnalyticsService transactionAnalyticsService;
    private final TicketAnalyticsService ticketAnalyticsService;
    private final EmployeeAnalyticsService employeeAnalyticsService;
    private final AttachmentStorageService attachmentStorageService;

    @Transactional(readOnly = true)
    @Cacheable(value = "systemHealth")
    public AdminSystemHealthDTO getSystemHealth() {
        boolean dbOk = true;
        try {
            userRepository.count();
        } catch (Exception e) {
            dbOk = false;
        }
        boolean storageOk = attachmentStorageService.isOperational();
        return new AdminSystemHealthDTO(dbOk, storageOk, "Local Storage");
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "dashboardMetrics", key = "{#start, #end}")
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
            ticketResult.avgResolutionHours(),
            transactionResult.pendingDepositsCount(),
            transactionResult.pendingDepositsAmount(),
            transactionResult.pendingWithdrawalsCount(),
            transactionResult.pendingWithdrawalsAmount(),
            employeeResult
        );
    }
}
