package com.tradex.api.entity;

import jakarta.persistence.*;
import com.tradex.api.enums.AdminAction;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_audit_log", indexes = {
        @Index(name = "idx_audit_target_created", columnList = "target_user_id, created_at DESC"),
        @Index(name = "idx_audit_actor_created",  columnList = "actor_user_id, created_at DESC")
})
@Getter
@NoArgsConstructor
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id", nullable = false)
    private User actor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id", nullable = false)
    private User target;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(50)")
    private AdminAction action;

    @Column(length = 500)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AdminAuditLog(User actor, User target, AdminAction action, String details) {
        this.actor = actor;
        this.target = target;
        this.action = action;
        this.details = details;
        this.createdAt = LocalDateTime.now();
    }
}
