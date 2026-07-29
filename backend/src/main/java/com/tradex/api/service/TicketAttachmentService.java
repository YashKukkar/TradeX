package com.tradex.api.service;

import com.tradex.api.dto.AttachmentDownload;
import com.tradex.api.entity.TicketAttachment;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.exception.AppException.ForbiddenException;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.repository.TicketAttachmentRepository;
import com.tradex.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TicketAttachmentService {

    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final UserRepository userRepository;
    private final AttachmentStorageService attachmentStorageService;

    @Transactional(readOnly = true)
    public AttachmentDownload getAttachmentDownload(String userEmail, Long attachmentId) {
        TicketAttachment attachment = ticketAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with id: " + attachmentId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        if (user.getRole() != Role.SUPER_ADMIN && user.getRole() != Role.EMPLOYEE && !attachment.getTicket().getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not have permission to view this attachment");
        }

        byte[] data = attachmentStorageService.retrieve(attachment.getStorageKey());
        return new AttachmentDownload(data, attachment.getFileName(), attachment.getContentType());
    }

    @Transactional
    public void processAndAttachFiles(com.tradex.api.entity.SupportTicket ticket, java.util.List<org.springframework.web.multipart.MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }
        for (org.springframework.web.multipart.MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                if (file.getSize() > 5 * 1024 * 1024) {
                    throw new com.tradex.api.exception.AppException.BadRequestException("File size exceeds limit of 5MB: " + file.getOriginalFilename());
                }
                try {
                    com.tradex.api.util.ImageCompressionUtil.CompressionResult result = com.tradex.api.util.ImageCompressionUtil.compressImage(file);
                    String effectiveFileName = com.tradex.api.util.ImageCompressionUtil.getEffectiveFileName(file.getOriginalFilename(), result.contentType());
                    
                    int dotIndex = effectiveFileName.lastIndexOf('.');
                    if (dotIndex > 0) {
                        effectiveFileName = effectiveFileName.substring(0, dotIndex) + "_" + System.currentTimeMillis() + effectiveFileName.substring(dotIndex);
                    } else {
                        effectiveFileName = effectiveFileName + "_" + System.currentTimeMillis();
                    }
                    
                    String storageKey = attachmentStorageService.store(
                            result.data(),
                            effectiveFileName,
                            result.contentType()
                    );
                    TicketAttachment attachment = TicketAttachment.builder()
                            .ticket(ticket)
                            .fileName(effectiveFileName)
                            .contentType(result.contentType())
                            .fileSize((long) result.data().length)
                            .storageKey(storageKey)
                            .build();
                    ticket.getAttachments().add(attachment);
                } catch (java.io.IOException e) {
                    throw new com.tradex.api.exception.AppException.BadRequestException("Could not process attachment: " + file.getOriginalFilename());
                }
            }
        }
    }
}
