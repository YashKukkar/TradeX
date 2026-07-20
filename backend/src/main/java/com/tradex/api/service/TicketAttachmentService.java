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
}
