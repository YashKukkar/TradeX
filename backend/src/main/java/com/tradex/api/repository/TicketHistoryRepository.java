package com.tradex.api.repository;

import com.tradex.api.entity.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import com.tradex.api.entity.SupportTicket;

@Repository
public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {
    List<TicketHistory> findByTicketIdOrderByCreatedAtDesc(Long ticketId);
    void deleteByTicketIn(List<SupportTicket> tickets);
}
