package com.tradex.api.dto;

import com.tradex.api.enums.TicketCategory;
import com.tradex.api.enums.TicketStatus;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketDTO {
    private Long id;
    private String ticketNumber;
    private String userEmail;
    private TicketCategory category;
    private String subject;
    private TicketStatus status;
    private String assignedToPermission;
    private String assignedToUserEmail;
    private Set<String> assignedToUserPermissions;
    private LocalDateTime claimedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
