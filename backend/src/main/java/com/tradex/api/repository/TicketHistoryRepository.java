package com.tradex.api.repository;

import com.tradex.api.entity.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.tradex.api.entity.SupportTicket;

public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {
    List<TicketHistory> findByTicketIdOrderByCreatedAtDesc(Long ticketId);
    void deleteByTicketIn(List<SupportTicket> tickets);
}
