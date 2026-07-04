package com.tradex.api.dto;

import com.tradex.api.entity.AdminAuditLog;
import java.time.ZoneId;

public record AdminAuditLogDTO(
    Long id,
    String actorEmail,
    String targetEmail,
    String action,
    String details,
    Long createdAt
) {
    public AdminAuditLogDTO(AdminAuditLog log) {
        this(
            log.getId(),
            log.getActor() != null ? log.getActor().getEmail() : "SYSTEM",
            log.getTarget() != null ? log.getTarget().getEmail() : "UNKNOWN",
            log.getAction() != null ? log.getAction().name() : "UNKNOWN",
            log.getDetails(),
            log.getCreatedAt() != null
                ? log.getCreatedAt().atZone(ZoneId.systemDefault()).toEpochSecond()
                : System.currentTimeMillis() / 1000
        );
    }
}
