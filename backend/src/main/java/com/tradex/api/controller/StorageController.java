package com.tradex.api.controller;

import com.tradex.api.config.AppProperties;
import com.tradex.api.dto.AttachmentDownload;
import com.tradex.api.service.SupportTicketService;
import com.tradex.api.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class StorageController {

    private final SupportTicketService supportTicketService;
    private final AppProperties appProperties;

    @GetMapping("/api/storage/{attachmentId}")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Long attachmentId, Authentication auth) {
        String email = SecurityUtils.getAuthenticatedEmail(auth);
        log.info("[Storage] Download | attachmentId={} | user={} | publicUrl={}",
                attachmentId, email, appProperties.getStorage().buildAccessUrl(attachmentId));
        AttachmentDownload download = supportTicketService.getAttachmentDownload(email, attachmentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + download.fileName() + "\"")
                .contentType(MediaType.parseMediaType(download.contentType()))
                .body(download.data());
    }
}
