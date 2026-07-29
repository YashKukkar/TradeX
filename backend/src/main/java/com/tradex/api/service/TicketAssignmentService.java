package com.tradex.api.service;

import com.tradex.api.dto.TicketDetailDTO;
import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.enums.TicketStatus;
import com.tradex.api.exception.AppException.BadRequestException;
import com.tradex.api.exception.AppException.ForbiddenException;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.mapper.TicketMapper;
import com.tradex.api.repository.SupportTicketRepository;
import com.tradex.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class TicketAssignmentService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final TicketHistoryService ticketHistoryService;
    private final TicketMapper ticketMapper;

    @Transactional
    public TicketDetailDTO assignTicket(Long ticketId, String permissionName, String adminEmail) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + adminEmail));

        if (permissionName == null || permissionName.trim().isEmpty()) {
            String oldPerm = ticket.getAssignedToPermission();
            ticket.setAssignedToPermission(null);
            ticket.setAssignedToUser(null);
            ticket.setClaimedAt(null);
            ticketHistoryService.logHistory(ticket, "UNASSIGNED", "Unassigned from group queue: " + (oldPerm != null ? oldPerm : "None"), adminEmail);
            log.info("Admin {} unassigned ticket {}", adminEmail, ticket.getTicketNumber());
        } else {
            String perm = permissionName.trim().toUpperCase();
            String oldPerm = ticket.getAssignedToPermission();
            ticket.setAssignedToPermission(perm);
            ticket.setAssignedToUser(null);
            ticket.setClaimedAt(null);
            ticketHistoryService.logHistory(ticket, "ASSIGNED", "Assigned to group queue: " + perm + (oldPerm != null ? " (transferred from " + oldPerm + ")" : ""), adminEmail);
            log.info("Admin {} assigned ticket {} to permission group {}", adminEmail, ticket.getTicketNumber(), perm);
        }

        supportTicketRepository.save(ticket);
        return ticketMapper.mapToDetailDTO(ticket, true);
    }

    @Transactional
    public TicketDetailDTO claimTicket(Long ticketId, String adminEmail) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + adminEmail));

        if (admin.getRole() != Role.SUPER_ADMIN) {
            // Cannot claim a ticket claimed by another agent
            if (ticket.getAssignedToUser() != null && !ticket.getAssignedToUser().getId().equals(admin.getId())) {
                throw new BadRequestException("This ticket is already claimed by another agent: " + ticket.getAssignedToUser().getEmail());
            }
            // Must have the matching permission group to claim the ticket (if group is assigned)
            if (ticket.getAssignedToPermission() != null && !admin.getPermissions().contains(ticket.getAssignedToPermission())) {
                throw new ForbiddenException("You do not have the required permission (" + ticket.getAssignedToPermission() + ") to claim this ticket");
            }
        }

        ticket.setAssignedToUser(admin);
        ticket.setClaimedAt(LocalDateTime.now());
        ticketHistoryService.logHistory(ticket, "SELF_ASSIGNED", "Ticket assigned to self by agent: " + adminEmail, adminEmail);

        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            ticketHistoryService.logHistory(ticket, "STATUS_CHANGED", "Status auto-updated to IN_PROGRESS upon self-assignment", "SYSTEM");
        }

        log.info("Ticket {} self-assigned by agent {}", ticket.getTicketNumber(), adminEmail);
        supportTicketRepository.save(ticket);
        return ticketMapper.mapToDetailDTO(ticket, true);
    }
}
