package com.tradex.api.service;

import com.tradex.api.dto.TicketCreateRequest;
import com.tradex.api.dto.TicketDetailDTO;
import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.TicketAttachment;
import com.tradex.api.entity.User;
import com.tradex.api.enums.TicketStatus;
import com.tradex.api.exception.AppException.BadRequestException;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.mapper.TicketMapper;
import com.tradex.api.repository.SupportTicketRepository;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.util.ImageCompressionUtil;
import com.tradex.api.util.ImageCompressionUtil.CompressionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class TicketCreationService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final AttachmentStorageService attachmentStorageService;
    private final TicketHistoryService ticketHistoryService;
    private final TicketMapper ticketMapper;

    @Transactional
    public TicketDetailDTO createTicket(String userEmail, TicketCreateRequest request, List<MultipartFile> files) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        long activeCount = supportTicketRepository.countByUserAndStatusIn(
                user,
                List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS)
        );
        if (activeCount >= 3) {
            throw new BadRequestException("You already have " + activeCount + " active support tickets. Please wait for them to be resolved before opening a new one.");
        }

        SupportTicket ticket = SupportTicket.builder()
                .ticketNumber("TEMP-" + UUID.randomUUID().toString().substring(0, 8))
                .user(user)
                .category(request.getCategory())
                .subject(request.getSubject())
                .description(request.getDescription())
                .status(TicketStatus.OPEN)
                .build();

        if (files != null && !files.isEmpty()) {
            if (files.size() > 5) {
                throw new BadRequestException("Maximum of 5 attachments allowed per ticket");
            }

            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;

                // Validate size (5MB max before compression)
                if (file.getSize() > 5 * 1024 * 1024) {
                    throw new BadRequestException("File size exceeds limit of 5MB: " + file.getOriginalFilename());
                }

                try {
                    CompressionResult result = ImageCompressionUtil.compressImage(file);
                    String effectiveFileName = ImageCompressionUtil.getEffectiveFileName(file.getOriginalFilename(), result.contentType());
                    
                    // Append timestamp before extension to ensure uniqueness and bypass browser cache
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
                } catch (IOException e) {
                    log.error("Failed to process attachment: " + file.getOriginalFilename(), e);
                    throw new BadRequestException("Could not process attachment: " + file.getOriginalFilename());
                }
            }
        }

        // Save first with temporary unique key to obtain the auto-increment ID
        SupportTicket savedTicket = supportTicketRepository.saveAndFlush(ticket);

        // Update with the sequential database-sequenced ticket number
        String ticketNumber = String.format("TKT-%05d", savedTicket.getId());
        savedTicket.setTicketNumber(ticketNumber);
        savedTicket = supportTicketRepository.save(savedTicket);

        ticketHistoryService.logHistory(savedTicket, "CREATED", "Ticket created with category: " + request.getCategory() + " and subject: '" + request.getSubject() + "'", userEmail);
        log.info("Created support ticket {} for user {}", savedTicket.getTicketNumber(), userEmail);
        return ticketMapper.mapToDetailDTO(savedTicket, false);
    }
}
