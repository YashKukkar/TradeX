package com.tradex.api.service;

import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.TicketHistory;
import com.tradex.api.repository.TicketHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TicketHistoryService {

    private final TicketHistoryRepository ticketHistoryRepository;

    @Transactional
    public void logHistory(SupportTicket ticket, String action, String details, String performedBy) {
        TicketHistory logEntry = TicketHistory.builder()
                .ticket(ticket)
                .action(action)
                .details(details)
                .performedBy(performedBy)
                .build();
        ticketHistoryRepository.save(logEntry);
    }
}
