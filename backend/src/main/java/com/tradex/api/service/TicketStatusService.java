package com.tradex.api.service;

import com.tradex.api.dto.TicketDetailDTO;
import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.enums.TicketStatus;
import com.tradex.api.exception.AppException.BadRequestException;
import com.tradex.api.exception.AppException.ForbiddenException;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.entity.TicketAttachment;
import com.tradex.api.mapper.TicketMapper;
import com.tradex.api.repository.SupportTicketRepository;
import com.tradex.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class TicketStatusService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final TicketHistoryService ticketHistoryService;
    private final TicketMapper ticketMapper;
    private final AttachmentStorageService attachmentStorageService;

    @Transactional
    public TicketDetailDTO updateTicketStatus(Long ticketId, TicketStatus status, String adminEmail) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + adminEmail));

        TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(status);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (status == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setResolvedBy(admin);
        } else if (status == TicketStatus.CLOSED) {
            if (ticket.getResolvedAt() == null) {
                ticket.setResolvedAt(LocalDateTime.now());
            }
            if (ticket.getResolvedBy() == null) {
                ticket.setResolvedBy(admin);
            }
        } else {
            ticket.setResolvedAt(null);
            ticket.setResolvedBy(null);
        }

        ticketHistoryService.logHistory(ticket, "STATUS_CHANGED", "Status changed from " + oldStatus + " to " + status, adminEmail);

        supportTicketRepository.save(ticket);
        log.info("Admin {} updated ticket {} status to {}", adminEmail, ticket.getTicketNumber(), status);
        return ticketMapper.mapToDetailDTO(ticket, true);
    }

    @Transactional
    public TicketDetailDTO reopenTicket(Long ticketId, String userEmail) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        boolean isAdmin = user.getRole() == Role.SUPER_ADMIN || user.getRole() == Role.EMPLOYEE;
        if (!isAdmin && !ticket.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not have permission to reopen this ticket");
        }

        if (ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new BadRequestException("Only resolved tickets can be reopened");
        }

        if (ticket.getReopenCount() >= 2) {
            throw new BadRequestException("This ticket has already been reopened the maximum number of times (2). Please raise a new support ticket instead.");
        }

        ticket.setStatus(TicketStatus.OPEN);
        ticket.setResolvedAt(null);
        ticket.setResolvedBy(null);
        ticket.setReopenCount(ticket.getReopenCount() + 1);
        ticket.setUpdatedAt(LocalDateTime.now());

        ticketHistoryService.logHistory(ticket, "REOPENED", "Ticket reopened (status set to OPEN)", userEmail);

        supportTicketRepository.save(ticket);
        log.info("Ticket {} reopened by {}", ticket.getTicketNumber(), userEmail);
        return ticketMapper.mapToDetailDTO(ticket, isAdmin);
    }

    @Transactional
    public TicketDetailDTO closeTicket(Long ticketId, String userEmail) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        boolean isAdmin = user.getRole() == Role.SUPER_ADMIN || user.getRole() == Role.EMPLOYEE;
        if (!isAdmin && !ticket.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not have permission to close this ticket");
        }

        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setUpdatedAt(LocalDateTime.now());

        ticketHistoryService.logHistory(ticket, "CLOSED", "Ticket closed (status set to CLOSED)", userEmail);

        supportTicketRepository.save(ticket);
        log.info("Ticket {} closed by {}", ticket.getTicketNumber(), userEmail);
        return ticketMapper.mapToDetailDTO(ticket, isAdmin);
    }

    @Scheduled(cron = "0 0 * * * *") // Runs every hour
    @Transactional
    public void autoCloseResolvedTickets() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(36);
        List<SupportTicket> toClose = supportTicketRepository.findByStatusAndResolvedAtBefore(
                TicketStatus.RESOLVED,
                cutoff
        );

        if (!toClose.isEmpty()) {
            for (SupportTicket ticket : toClose) {
                if (ticket.getAttachments() != null) {
                    for (TicketAttachment attachment : ticket.getAttachments()) {
                        try {
                            attachmentStorageService.delete(attachment.getStorageKey());
                        } catch (Exception e) {
                            log.error("Failed to delete dormant S3 attachment: " + attachment.getStorageKey(), e);
                        }
                    }
                    ticket.getAttachments().clear();
                }
                ticket.setStatus(TicketStatus.CLOSED);
                ticket.setUpdatedAt(LocalDateTime.now());
                ticketHistoryService.logHistory(ticket, "CLOSED", "Ticket automatically closed due to inactivity and attachments deleted.", "SYSTEM");
            }
            supportTicketRepository.saveAll(toClose);
            log.info("Auto-closed {} resolved tickets and cleaned up attachments.", toClose.size());
        }
    }
}
