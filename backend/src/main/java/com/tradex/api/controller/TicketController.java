package com.tradex.api.controller;

import com.tradex.api.dto.*;
import com.tradex.api.service.SupportTicketService;
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
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class TicketController {

    private final SupportTicketService supportTicketService;

    @PostMapping(value = "/tickets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketDetailDTO> createTicket(
            @RequestPart("ticket") @Valid TicketCreateRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Authentication auth) {
        log.info("User {} creating support ticket: {}", auth.getName(), request.getSubject());
        TicketDetailDTO ticket = supportTicketService.createTicket(auth.getName(), request, files);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<TicketDTO>> getUserTickets(Authentication auth) {
        return ResponseEntity.ok(supportTicketService.getUserTickets(auth.getName()));
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<TicketDetailDTO> getTicketDetail(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(supportTicketService.getTicketDetail(auth.getName(), id));
    }

    @PostMapping("/tickets/{id}/comments")
    public ResponseEntity<TicketCommentDTO> addComment(
            @PathVariable Long id,
            @Valid @RequestBody TicketCommentRequest request,
            Authentication auth) {
        return ResponseEntity.ok(supportTicketService.addComment(auth.getName(), id, request, null));
    }

    @PostMapping(value = "/tickets/{id}/comments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketCommentDTO> addCommentWithFiles(
            @PathVariable Long id,
            @RequestPart("comment") @Valid TicketCommentRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Authentication auth) {
        return ResponseEntity.ok(supportTicketService.addComment(auth.getName(), id, request, files));
    }

    @PostMapping("/tickets/{id}/reopen")
    public ResponseEntity<TicketDetailDTO> reopenTicket(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(supportTicketService.reopenTicket(id, auth.getName()));
    }

    @PostMapping("/tickets/{id}/close")
    public ResponseEntity<TicketDetailDTO> closeTicket(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(supportTicketService.closeTicket(id, auth.getName()));
    }

    @GetMapping("/tickets/attachments/{attachmentId}")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Long attachmentId, Authentication auth) {
        log.info("[Download] Request | attachmentId={} | user={}", attachmentId, auth.getName());
        AttachmentDownload download = supportTicketService.getAttachmentDownload(auth.getName(), attachmentId);
        log.info("[Download] Success | attachmentId={} | fileName={} | size={} bytes", attachmentId, download.fileName(), download.data().length);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + download.fileName() + "\"")
                .contentType(MediaType.parseMediaType(download.contentType()))
                .body(download.data());
    }
}
