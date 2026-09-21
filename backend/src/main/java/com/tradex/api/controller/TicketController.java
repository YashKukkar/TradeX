package com.tradex.api.controller;

import com.tradex.api.dto.*;
import com.tradex.api.service.SupportTicketService;
import com.tradex.api.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@Slf4j
public class TicketController {

    private final SupportTicketService supportTicketService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketDetailDTO> createTicket(
            @RequestPart("ticket") @Valid TicketCreateRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Authentication auth) {
        String email = SecurityUtils.getAuthenticatedEmail(auth);
        log.info("User {} creating support ticket: {}", email, request.getSubject());
        TicketDetailDTO ticket = supportTicketService.createTicket(email, request, files);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @GetMapping
    public ResponseEntity<List<TicketDTO>> getUserTickets(Authentication auth) {
        return ResponseEntity.ok(supportTicketService.getUserTickets(SecurityUtils.getAuthenticatedEmail(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketDetailDTO> getTicketDetail(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(supportTicketService.getTicketDetail(SecurityUtils.getAuthenticatedEmail(auth), id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketCommentDTO> addComment(
            @PathVariable Long id,
            @Valid @RequestBody TicketCommentRequest request,
            Authentication auth) {
        return ResponseEntity.ok(supportTicketService.addComment(SecurityUtils.getAuthenticatedEmail(auth), id, request, null));
    }

    @PostMapping(value = "/{id}/comments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketCommentDTO> addCommentWithFiles(
            @PathVariable Long id,
            @RequestPart("comment") @Valid TicketCommentRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Authentication auth) {
        return ResponseEntity.ok(supportTicketService.addComment(SecurityUtils.getAuthenticatedEmail(auth), id, request, files));
    }

    @PostMapping("/{id}/reopen")
    public ResponseEntity<TicketDetailDTO> reopenTicket(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(supportTicketService.reopenTicket(id, SecurityUtils.getAuthenticatedEmail(auth)));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<TicketDetailDTO> closeTicket(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(supportTicketService.closeTicket(id, SecurityUtils.getAuthenticatedEmail(auth)));
    }

    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Long attachmentId, Authentication auth) {
        String email = SecurityUtils.getAuthenticatedEmail(auth);
        log.info("[Download] Request | attachmentId={} | user={}", attachmentId, email);
        AttachmentDownload download = supportTicketService.getAttachmentDownload(email, attachmentId);
        log.info("[Download] Success | attachmentId={} | fileName={} | size={} bytes", attachmentId,
                download.fileName(), download.data().length);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + download.fileName() + "\"")
                .contentType(MediaType.parseMediaType(download.contentType()))
                .body(download.data());
    }
}
