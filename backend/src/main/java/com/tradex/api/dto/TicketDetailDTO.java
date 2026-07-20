package com.tradex.api.dto;

import com.tradex.api.enums.TicketCategory;
import com.tradex.api.enums.TicketStatus;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketDetailDTO {
    private Long id;
    private String ticketNumber;
    private String userEmail;
    private TicketCategory category;
    private String subject;
    private String description;
    private TicketStatus status;

    private String adminNotes;
    private String resolvedByEmail;
    private String assignedToPermission;
    private String assignedToUserEmail;
    private Set<String> assignedToUserPermissions;
    private LocalDateTime claimedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private int reopenCount;
    private List<TicketAttachmentDTO> attachments;
    private List<TicketCommentDTO> comments;
    private List<TicketHistoryDTO> history;
}
