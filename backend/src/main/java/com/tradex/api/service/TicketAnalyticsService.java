package com.tradex.api.service;

import com.tradex.api.enums.TicketStatus;
import com.tradex.api.repository.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketAnalyticsService {

    private final SupportTicketRepository supportTicketRepository;

    public record TicketAnalytics(long openTickets, long resolvedTickets) {}

    @Transactional(readOnly = true)
    @Cacheable(value = "ticketStats", key = "{#start, #end}")
    public TicketAnalytics getTicketAnalytics(LocalDateTime start, LocalDateTime end) {
        return new TicketAnalytics(
            countActiveTickets(),
            countResolvedTickets(start, end)
        );
    }

    @Transactional(readOnly = true)
    public long countActiveTickets() {
        return supportTicketRepository.countByStatusIn(List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS));
    }

    @Transactional(readOnly = true)
    public long countResolvedTickets(LocalDateTime start, LocalDateTime end) {
        return supportTicketRepository.countByStatusInAndResolvedAtBetween(
                List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED), start, end);
    }

    @Transactional(readOnly = true)
    public List<SupportTicketRepository.EmployeeTicketResolvedProjection> getEmployeeResolvedTickets(LocalDateTime start, LocalDateTime end) {
        return supportTicketRepository.getEmployeeResolvedTicketsCount(
                List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED), start, end);
    }

    @Transactional(readOnly = true)
    public List<SupportTicketRepository.EmployeeTicketPendingProjection> getEmployeePendingTickets() {
        return supportTicketRepository.getEmployeePendingTicketsCount(
                List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS));
    }

    @Transactional(readOnly = true)
    public List<SupportTicketRepository.EmployeeResolutionTimeProjection> getEmployeeResolutionTimes(LocalDateTime start, LocalDateTime end) {
        return supportTicketRepository.getEmployeeResolutionTimes(
                List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED), start, end);
    }
}
