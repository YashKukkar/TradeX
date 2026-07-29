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

    long countByStatusIn(List<TicketStatus> statuses);
    long countByStatusInAndResolvedAtBetween(List<TicketStatus> statuses, LocalDateTime start, LocalDateTime end);

    interface EmployeeTicketResolvedProjection {
        Long getEmployeeId();
        Long getTicketCount();
    }

    interface EmployeeTicketPendingProjection {
        Long getEmployeeId();
        Long getTicketCount();
    }

    @Query("SELECT t.resolvedBy.id AS employeeId, COUNT(t) AS ticketCount FROM SupportTicket t " +
           "WHERE t.status IN :statuses " +
           "AND t.resolvedAt BETWEEN :start AND :end AND t.resolvedBy IS NOT NULL " +
           "GROUP BY t.resolvedBy.id")
    List<EmployeeTicketResolvedProjection> getEmployeeResolvedTicketsCount(
            @Param("statuses") List<TicketStatus> statuses,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT t.assignedToUser.id AS employeeId, COUNT(t) AS ticketCount FROM SupportTicket t " +
           "WHERE t.status IN :statuses " +
           "AND t.assignedToUser IS NOT NULL " +
           "GROUP BY t.assignedToUser.id")
    List<EmployeeTicketPendingProjection> getEmployeePendingTicketsCount(
            @Param("statuses") List<TicketStatus> statuses);

    interface EmployeeResolutionTimeProjection {
        Long getEmployeeId();
        LocalDateTime getClaimedAt();
        LocalDateTime getResolvedAt();
    }

    @Query("SELECT t.resolvedBy.id AS employeeId, t.claimedAt AS claimedAt, t.resolvedAt AS resolvedAt FROM SupportTicket t " +
           "WHERE t.status IN :statuses " +
           "AND t.resolvedAt BETWEEN :start AND :end " +
           "AND t.resolvedBy IS NOT NULL " +
           "AND t.claimedAt IS NOT NULL")
    List<EmployeeResolutionTimeProjection> getEmployeeResolutionTimes(
            @Param("statuses") List<TicketStatus> statuses,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}

