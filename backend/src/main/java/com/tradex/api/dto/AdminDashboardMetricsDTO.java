package com.tradex.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardMetricsDTO(
    long totalUsers,
    long newRegistrations,
    BigDecimal totalDeposits,
    long totalDepositsCount,
    BigDecimal totalWithdrawals,
    long totalWithdrawalsCount,
    long openTickets,
    long resolvedTickets,
    long pendingDepositsCount,
    BigDecimal pendingDepositsAmount,
    long pendingWithdrawalsCount,
    BigDecimal pendingWithdrawalsAmount,
    List<EmployeeMetricsDTO> employeePerformance
) {
    public record EmployeeMetricsDTO(
        Long employeeId,
        String email,
        long ticketsResolved,
        long ticketsPending,
        long depositApprovals,
        long withdrawalApprovals,
        List<String> permissions,
        long avgTicketResolutionTimeSeconds,
        long avgTxProcessingTimeSeconds
    ) {}
}
