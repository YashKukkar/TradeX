package com.tradex.api.service;

import com.tradex.api.dto.TicketCommentDTO;
import com.tradex.api.dto.TicketCommentRequest;
import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.TicketAttachment;
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
import com.tradex.api.util.ImageCompressionUtil;
import com.tradex.api.util.ImageCompressionUtil.CompressionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class TicketCommentService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final AttachmentStorageService attachmentStorageService;
    private final TicketHistoryService ticketHistoryService;
    private final TicketMapper ticketMapper;

    @Transactional
    public TicketCommentDTO addComment(String userEmail, Long ticketId, TicketCommentRequest request, List<MultipartFile> files) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        User author = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        boolean isAdmin = author.getRole() == Role.SUPER_ADMIN || author.getRole() == Role.EMPLOYEE;
        if (!isAdmin && !ticket.getUser().getId().equals(author.getId())) {
            throw new ForbiddenException("You do not have permission to reply to this ticket");
        }

        if (author.getRole() == Role.EMPLOYEE) {
            // Cannot comment if claimed by someone else
            if (ticket.getAssignedToUser() != null && !ticket.getAssignedToUser().getId().equals(author.getId())) {
                throw new ForbiddenException("You cannot reply to a ticket claimed by another agent.");
            }
            // Cannot comment if group is assigned and they don't have the permission
            if (ticket.getAssignedToPermission() != null && !author.getPermissions().contains(ticket.getAssignedToPermission())) {
                throw new ForbiddenException("You do not have the required permission group to reply to this ticket.");
            }
        }

        if (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED) {
            throw new BadRequestException("Chat is disabled for resolved or closed tickets. Please reopen the ticket first.");
        }

        if (ticket.getComments().size() >= 50) {
            throw new BadRequestException("This support ticket has reached the maximum conversation limit of 50 messages. Please raise a new ticket.");
        }

        if (files != null && !files.isEmpty()) {
            long newFilesCount = files.stream().filter(file -> !file.isEmpty()).count();
            if (newFilesCount > 0) {
                if (author.getRole() != Role.USER) {
                    throw new BadRequestException("Support staff are not permitted to upload attachments.");
                }
                int currentAttachmentsCount = ticket.getAttachments().size();
                if (currentAttachmentsCount + newFilesCount > 5) {
                    throw new BadRequestException("This ticket cannot have more than 5 total attachments. Currently has " + currentAttachmentsCount + ".");
                }
            }

            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    if (file.getSize() > 5 * 1024 * 1024) {
                        throw new BadRequestException("File size exceeds limit of 5MB: " + file.getOriginalFilename());
                    }
                    try {
                        CompressionResult result = ImageCompressionUtil.compressImage(file);
                        String effectiveFileName = ImageCompressionUtil.getEffectiveFileName(file.getOriginalFilename(), result.contentType());
                        
                        // Append timestamp before extension to ensure uniqueness and bypass browser cache
                        int dotIndex = effectiveFileName.lastIndexOf('.');
                        if (dotIndex > 0) {
                            effectiveFileName = effectiveFileName.substring(0, dotIndex) + "_" + System.currentTimeMillis() + effectiveFileName.substring(dotIndex);
                        } else {
                            effectiveFileName = effectiveFileName + "_" + System.currentTimeMillis();
                        }
                        
                        String storageKey = attachmentStorageService.store(
                                result.data(),
                                effectiveFileName,
                                result.contentType()
                        );
                        TicketAttachment attachment = TicketAttachment.builder()
                                .ticket(ticket)
                                .fileName(effectiveFileName)
                                .contentType(result.contentType())
                                .fileSize((long) result.data().length)
                                .storageKey(storageKey)
                                .build();
                        ticket.getAttachments().add(attachment);
                    } catch (IOException e) {
                        log.error("Failed to process attachment: " + file.getOriginalFilename(), e);
                        throw new BadRequestException("Could not process attachment: " + file.getOriginalFilename());
                    }
                }
            }
        }

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(author)
                .message(request.getMessage())
                .adminReply(isAdmin)
                .build();

        ticket.getComments().add(comment);
        ticket.setUpdatedAt(LocalDateTime.now());

        ticketHistoryService.logHistory(ticket, "COMMENT_ADDED", "Reply added: " + (request.getMessage().length() > 60 ? request.getMessage().substring(0, 57) + "..." : request.getMessage()), userEmail);

        // Auto transition status when replied
        if (isAdmin && ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            ticketHistoryService.logHistory(ticket, "STATUS_CHANGED", "Status auto-updated to IN_PROGRESS upon agent reply", "SYSTEM");
        }

        supportTicketRepository.save(ticket);
        log.info("User {} added comment to ticket {}", userEmail, ticket.getTicketNumber());

        return ticketMapper.mapToCommentDTO(comment);
    }
}
