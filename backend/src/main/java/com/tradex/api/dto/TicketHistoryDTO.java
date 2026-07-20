package com.tradex.api.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketHistoryDTO {
    private Long id;
    private String action;
    private String details;
    private String performedBy;
    private LocalDateTime createdAt;
}
