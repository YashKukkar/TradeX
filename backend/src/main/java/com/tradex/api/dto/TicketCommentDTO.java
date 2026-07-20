package com.tradex.api.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketCommentDTO {
    private Long id;
    private String authorEmail;
    private String message;
    private boolean adminReply;
    private LocalDateTime createdAt;
}
