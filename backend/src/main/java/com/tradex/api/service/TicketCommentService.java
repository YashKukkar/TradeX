package com.tradex.api.service;

import com.tradex.api.dto.TicketCommentDTO;
import com.tradex.api.dto.TicketCommentRequest;
import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.TicketComment;
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
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j

public class TicketCommentService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final TicketAttachmentService ticketAttachmentService;
    private final TicketHistoryService ticketHistoryService;
    private final TicketMapper ticketMapper;

    @Transactional
    public TicketCommentDTO addComment(String userEmail, Long ticketId, TicketCommentRequest request,
            List<MultipartFile> files) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        User author = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        boolean isAdmin = author.getRole() == Role.SUPER_ADMIN || author.getRole() == Role.EMPLOYEE;
        if (!isAdmin && !ticket.getUser().getId().equals(author.getId())) {
            log.warn("Forbidden ticket reply: User {} attempted to reply to ticket {} owned by user ID {}",
                    userEmail, ticketId, ticket.getUser().getId());
            throw new ForbiddenException("You do not have permission to reply to this ticket");
        }

        if (author.getRole() == Role.EMPLOYEE) {
            // Cannot comment if claimed by someone else
            if (ticket.getAssignedToUser() != null && !ticket.getAssignedToUser().getId().equals(author.getId())) {
                log.warn("Forbidden ticket reply: Agent {} attempted to reply to ticket {} claimed by agent {}",
                        userEmail, ticketId, ticket.getAssignedToUser().getEmail());
                throw new ForbiddenException("You cannot reply to a ticket claimed by another agent.");
            }
            // Cannot comment if group is assigned and they don't have the permission
            if (ticket.getAssignedToPermission() != null
                    && !author.getPermissions().contains(ticket.getAssignedToPermission())) {
                log.warn("Forbidden ticket reply: Agent {} lacks required permission group {} for ticket {}",
                        userEmail, ticket.getAssignedToPermission(), ticketId);
                throw new ForbiddenException("You do not have the required permission group to reply to this ticket.");
            }
        }

        if (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED) {
            log.warn("Failed comment addition: Chat is disabled for ticket {} in status {}", ticketId,
                    ticket.getStatus());
            throw new BadRequestException(
                    "Chat is disabled for resolved or closed tickets. Please reopen the ticket first.");
        }

        if (ticket.getComments().size() >= 50) {
            log.warn("Failed comment addition: Conversation limit (50) reached for ticket {}", ticketId);
            throw new BadRequestException(
                    "This support ticket has reached the maximum conversation limit of 50 messages. Please raise a new ticket.");
        }

        if (files != null && !files.isEmpty()) {
            long newFilesCount = files.stream().filter(file -> !file.isEmpty()).count();
            if (newFilesCount > 0) {
                if (author.getRole() != Role.USER) {
                    log.warn("Failed comment addition: Support staff {} attempted to upload attachments to ticket {}",
                            userEmail, ticketId);
                    throw new BadRequestException("Support staff are not permitted to upload attachments.");
                }
                int currentAttachmentsCount = ticket.getAttachments().size();
                if (currentAttachmentsCount + newFilesCount > 5) {
                    log.warn("Failed comment addition: Attachment limit exceeded (limit: 5) for ticket {}", ticketId);
                    throw new BadRequestException(
                            "This ticket cannot have more than 5 total attachments. Currently has "
                                    + currentAttachmentsCount + ".");
                }
            }
            ticketAttachmentService.processAndAttachFiles(ticket, files);
        }

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(author)
                .message(request.getMessage())
                .adminReply(isAdmin)
                .build();

        ticket.getComments().add(comment);
        ticket.setUpdatedAt(LocalDateTime.now());

        ticketHistoryService.logHistory(ticket, "COMMENT_ADDED",
                "Reply added: " + (request.getMessage().length() > 60 ? request.getMessage().substring(0, 57) + "..."
                        : request.getMessage()),
                userEmail);

        // Auto transition status when replied
        if (isAdmin && ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            ticketHistoryService.logHistory(ticket, "STATUS_CHANGED",
                    "Status auto-updated to IN_PROGRESS upon agent reply", "SYSTEM");
        }

        supportTicketRepository.save(ticket);
        log.info("User {} added comment to ticket {}", userEmail, ticket.getTicketNumber());

        return ticketMapper.mapToCommentDTO(comment);
    }
}
