package com.tradex.api.service;

import com.tradex.api.dto.AdminDashboardMetricsDTO.EmployeeMetricsDTO;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.SupportTicketRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class EmployeeAnalyticsService {

    private final UserRepository userRepository;
    private final TransactionAnalyticsService transactionAnalyticsService;
    private final TicketAnalyticsService ticketAnalyticsService;

    @Transactional(readOnly = true)
    @Cacheable(value = "employeePerformance", key = "{#start, #end}")
    public List<EmployeeMetricsDTO> getEmployeePerformance(LocalDateTime start, LocalDateTime end) {
        List<User> employees = userRepository.findByRole(Role.EMPLOYEE);

        List<WalletTransactionRepository.EmployeeWalletPerformanceProjection> walletPerfList =
                transactionAnalyticsService.getEmployeeWalletPerformance(start, end);
        Map<Long, Map<WalletTransactionType, Long>> walletPerfMap = new HashMap<>();
        for (WalletTransactionRepository.EmployeeWalletPerformanceProjection record : walletPerfList) {
            Long empId = record.getEmployeeId();
            WalletTransactionType type = record.getType();
            Long count = record.getTxCount();
            walletPerfMap.computeIfAbsent(empId, k -> new HashMap<>()).put(type, count);
        }

        List<SupportTicketRepository.EmployeeTicketResolvedProjection> resolvedPerfList =
                ticketAnalyticsService.getEmployeeResolvedTickets(start, end);
        Map<Long, Long> resolvedPerfMap = new HashMap<>();
        for (SupportTicketRepository.EmployeeTicketResolvedProjection record : resolvedPerfList) {
            Long empId = record.getEmployeeId();
            Long count = record.getTicketCount();
            resolvedPerfMap.put(empId, count);
        }

        List<SupportTicketRepository.EmployeeTicketPendingProjection> pendingPerfList =
                ticketAnalyticsService.getEmployeePendingTickets();
        Map<Long, Long> pendingPerfMap = new HashMap<>();
        for (SupportTicketRepository.EmployeeTicketPendingProjection record : pendingPerfList) {
            Long empId = record.getEmployeeId();
            Long count = record.getTicketCount();
            pendingPerfMap.put(empId, count);
        }

        List<SupportTicketRepository.EmployeeResolutionTimeProjection> resTimesList =
                ticketAnalyticsService.getEmployeeResolutionTimes(start, end);
        Map<Long, List<Long>> resTimesMap = new HashMap<>();
        for (SupportTicketRepository.EmployeeResolutionTimeProjection record : resTimesList) {
            if (record.getClaimedAt() != null && record.getResolvedAt() != null) {
                long seconds = java.time.Duration.between(record.getClaimedAt(), record.getResolvedAt()).toSeconds();
                resTimesMap.computeIfAbsent(record.getEmployeeId(), k -> new ArrayList<>()).add(seconds);
            }
        }

        List<WalletTransactionRepository.EmployeeTxProcessingTimeProjection> txTimesList =
                transactionAnalyticsService.getEmployeeTxProcessingTimes(start, end);
        Map<Long, List<Long>> txTimesMap = new HashMap<>();
        for (WalletTransactionRepository.EmployeeTxProcessingTimeProjection record : txTimesList) {
            if (record.getCreatedAt() != null && record.getApprovedAt() != null) {
                long seconds = java.time.Duration.between(record.getCreatedAt(), record.getApprovedAt()).toSeconds();
                txTimesMap.computeIfAbsent(record.getEmployeeId(), k -> new ArrayList<>()).add(seconds);
            }
        }

        List<EmployeeMetricsDTO> employeePerformance = new ArrayList<>();
        for (User emp : employees) {
            Long empId = emp.getId();
            long tResolved = resolvedPerfMap.getOrDefault(empId, 0L);
            long tPending = pendingPerfMap.getOrDefault(empId, 0L);

            long depApprovals = 0L;
            long withApprovals = 0L;
            Map<WalletTransactionType, Long> typeMap = walletPerfMap.get(empId);
            if (typeMap != null) {
                depApprovals = typeMap.getOrDefault(WalletTransactionType.DEPOSIT, 0L);
                withApprovals = typeMap.getOrDefault(WalletTransactionType.WITHDRAWAL, 0L);
            }

            long avgTicketResolutionTimeSeconds = 0L;
            List<Long> times = resTimesMap.get(empId);
            if (times != null && !times.isEmpty()) {
                long sum = 0L;
                for (long t : times) sum += t;
                avgTicketResolutionTimeSeconds = sum / times.size();
            }

            long avgTxProcessingTimeSeconds = 0L;
            List<Long> txtimes = txTimesMap.get(empId);
            if (txtimes != null && !txtimes.isEmpty()) {
                long sum = 0L;
                for (long t : txtimes) sum += t;
                avgTxProcessingTimeSeconds = sum / txtimes.size();
            }

            List<String> perms = emp.getPermissions() != null ? new ArrayList<>(emp.getPermissions()) : new ArrayList<>();

            employeePerformance.add(new EmployeeMetricsDTO(
                    empId,
                    emp.getEmail(),
                    tResolved,
                    tPending,
                    depApprovals,
                    withApprovals,
                    perms,
                    avgTicketResolutionTimeSeconds,
                    avgTxProcessingTimeSeconds
            ));
        }

        return employeePerformance;
    }
}
