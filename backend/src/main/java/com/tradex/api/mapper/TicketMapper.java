package com.tradex.api.mapper;

import com.tradex.api.dto.*;
import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.TicketComment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class TicketMapper {

    public TicketDTO mapToDTO(SupportTicket ticket) {
        return TicketDTO.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .userEmail(ticket.getUser().getEmail())
                .category(ticket.getCategory())
                .subject(ticket.getSubject())
                .status(ticket.getStatus())
                .assignedToPermission(ticket.getAssignedToPermission())
                .assignedToUserEmail(ticket.getAssignedToUser() != null ? ticket.getAssignedToUser().getEmail() : null)
                .assignedToUserPermissions(ticket.getAssignedToUser() != null ? new HashSet<>(ticket.getAssignedToUser().getPermissions()) : null)
                .claimedAt(ticket.getClaimedAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }

    public TicketDetailDTO mapToDetailDTO(SupportTicket ticket, boolean isEmployee) {
        List<TicketAttachmentDTO> attachmentDTOs = ticket.getAttachments().stream()
                .map(att -> TicketAttachmentDTO.builder()
                        .id(att.getId())
                        .fileName(att.getFileName())
                        .contentType(att.getContentType())
                        .fileSize(att.getFileSize())
                        .createdAt(att.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        List<TicketCommentDTO> commentDTOs = ticket.getComments() != null
                ? ticket.getComments().stream().map(this::mapToCommentDTO).collect(Collectors.toList())
                : Collections.emptyList();

        List<TicketHistoryDTO> historyDTOs = (!isEmployee || ticket.getHistory() == null) ? new ArrayList<>() : ticket.getHistory().stream()
                .map(h -> TicketHistoryDTO.builder()
                        .id(h.getId())
                        .action(h.getAction())
                        .details(h.getDetails())
                        .performedBy(h.getPerformedBy())
                        .createdAt(h.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return TicketDetailDTO.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .userEmail(ticket.getUser().getEmail())
                .category(ticket.getCategory())
                .subject(ticket.getSubject())
                .description(ticket.getDescription())
                .status(ticket.getStatus())

                .resolvedByEmail(isEmployee && ticket.getResolvedBy() != null ? ticket.getResolvedBy().getEmail() : null)
                .assignedToPermission(isEmployee ? ticket.getAssignedToPermission() : null)
                .assignedToUserEmail(ticket.getAssignedToUser() != null ? (isEmployee ? ticket.getAssignedToUser().getEmail() : "Support Agent") : null)
                .assignedToUserPermissions(isEmployee && ticket.getAssignedToUser() != null ? new HashSet<>(ticket.getAssignedToUser().getPermissions()) : null)
                .claimedAt(isEmployee ? ticket.getClaimedAt() : null)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .resolvedAt(ticket.getResolvedAt())
                .reopenCount(ticket.getReopenCount())
                .attachments(attachmentDTOs)
                .comments(commentDTOs)
                .history(historyDTOs)
                .build();
    }

    public TicketCommentDTO mapToCommentDTO(TicketComment comment) {
        return TicketCommentDTO.builder()
                .id(comment.getId())
                .authorEmail(comment.getAuthor().getEmail())
                .message(comment.getMessage())
                .adminReply(comment.isAdminReply())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
