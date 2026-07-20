package com.tradex.api.dto;

import com.tradex.api.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
    @NotNull(message = "Status is required") TicketStatus status
) {}
