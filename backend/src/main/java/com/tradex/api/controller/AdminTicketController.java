package com.tradex.api.controller;

import com.tradex.api.dto.*;
import com.tradex.api.service.SupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tickets")
@RequiredArgsConstructor
@Slf4j
public class AdminTicketController {

    private final SupportTicketService supportTicketService;

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYEE')")
    @GetMapping
    public ResponseEntity<List<TicketDTO>> getAllTickets(Authentication auth) {
        return ResponseEntity.ok(supportTicketService.getAllTickets(auth.getName()));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYEE')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketDetailDTO> updateTicketStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request,
            Authentication auth) {
        return ResponseEntity.ok(supportTicketService.updateTicketStatus(id, request.status(), auth.getName()));
    }



    public record AssignTicketRequest(String assignedToPermission) {}

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYEE')")
    @PatchMapping("/{id}/assign")
    public ResponseEntity<TicketDetailDTO> assignTicket(
            @PathVariable Long id,
            @RequestBody AssignTicketRequest request,
            Authentication auth) {
        return ResponseEntity.ok(supportTicketService.assignTicket(id, request.assignedToPermission(), auth.getName()));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYEE')")
    @PatchMapping("/{id}/claim")
    public ResponseEntity<TicketDetailDTO> claimTicket(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(supportTicketService.claimTicket(id, auth.getName()));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_USERS')")
    @GetMapping("/active")
    public ResponseEntity<List<TicketDTO>> getUserActiveTickets(
            @RequestParam String email) {
        return ResponseEntity.ok(supportTicketService.getUserActiveTickets(email));
    }
}
