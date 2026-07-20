package com.tradex.api.repository;

import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.User;
import com.tradex.api.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByUserOrderByCreatedAtDesc(User user);
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
    Optional<SupportTicket> findByTicketNumber(String ticketNumber);
    List<SupportTicket> findByStatusAndResolvedAtBefore(TicketStatus status, LocalDateTime dateTime);
    List<SupportTicket> findByUserAndStatusIn(User user, List<TicketStatus> statuses);
    long countByUserAndStatusIn(User user, List<TicketStatus> statuses);


    @Modifying
    @Query("UPDATE SupportTicket t SET t.status = :closedStatus, t.updatedAt = :now WHERE t.status = :resolvedStatus AND t.resolvedAt < :cutoff")
    int closeResolvedTickets(
            @Param("closedStatus") TicketStatus closedStatus,
            @Param("resolvedStatus") TicketStatus resolvedStatus,
            @Param("cutoff") LocalDateTime cutoff,
            @Param("now") LocalDateTime now
    );
}

