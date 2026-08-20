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

    public record TicketAnalytics(long openTickets, long resolvedTickets, Double avgResolutionHours) {}

    @Transactional(readOnly = true)
    @Cacheable(value = "ticketStats", key = "{#start, #end}")
    public TicketAnalytics getTicketAnalytics(LocalDateTime start, LocalDateTime end) {
        List<SupportTicketRepository.EmployeeResolutionTimeProjection> times =
                supportTicketRepository.getEmployeeResolutionTimes(List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED), start, end);
        double totalHours = 0.0;
        int count = 0;
        for (var t : times) {
            if (t.getClaimedAt() != null && t.getResolvedAt() != null) {
                long secs = java.time.Duration.between(t.getClaimedAt(), t.getResolvedAt()).getSeconds();
                if (secs > 0) {
                    totalHours += (double) secs / 3600.0;
                    count++;
                }
            }
        }
        double avg = count > 0 ? totalHours / count : 0.0;

        return new TicketAnalytics(
            countActiveTickets(),
            countResolvedTickets(start, end),
            Math.round(avg * 10.0) / 10.0
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
