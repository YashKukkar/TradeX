package com.tradex.api.service;

import com.tradex.api.dto.*;
import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.enums.TicketStatus;
import com.tradex.api.exception.AppException.ForbiddenException;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.mapper.TicketMapper;
import com.tradex.api.repository.SupportTicketRepository;
import com.tradex.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.tradex.api.annotation.EvictDashboardCache;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j

public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;

    private final TicketMapper ticketMapper;
    private final TicketCreationService ticketCreationService;
    private final TicketCommentService ticketCommentService;
    private final TicketAttachmentService ticketAttachmentService;
    private final TicketAssignmentService ticketAssignmentService;
    private final TicketStatusService ticketStatusService;

    @Transactional
    public TicketDetailDTO createTicket(String userEmail, TicketCreateRequest request, List<MultipartFile> files) {
        return ticketCreationService.createTicket(userEmail, request, files);
    }

    @Transactional(readOnly = true)
    public List<TicketDTO> getUserTickets(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        return supportTicketRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(ticketMapper::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketDetailDTO getTicketDetail(String userEmail, Long ticketId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        boolean isOwner = ticket.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.SUPER_ADMIN || user.getRole() == Role.EMPLOYEE;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You do not have permission to view this ticket");
        }

        return ticketMapper.mapToDetailDTO(ticket, isAdmin);
    }

    @Transactional
    @EvictDashboardCache("tickets")
    public TicketCommentDTO addComment(String userEmail, Long ticketId, TicketCommentRequest request,
            List<MultipartFile> files) {
        return ticketCommentService.addComment(userEmail, ticketId, request, files);
    }

    @Transactional(readOnly = true)
    public AttachmentDownload getAttachmentDownload(String userEmail, Long attachmentId) {
        return ticketAttachmentService.getAttachmentDownload(userEmail, attachmentId);
    }

    @Transactional(readOnly = true)
    public List<TicketDTO> getAllTickets(String employeeEmail) {
        User user = userRepository.findByEmail(employeeEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + employeeEmail));

        boolean canManageAll = user.getRole() == Role.SUPER_ADMIN || user.getRole() == Role.EMPLOYEE;
        if (!canManageAll) {
            throw new ForbiddenException("You do not have permission to view support tickets");
        }

        List<SupportTicket> tickets = supportTicketRepository.findAllByOrderByCreatedAtDesc();

        if (user.getRole() == Role.EMPLOYEE) {
            Set<String> employeePerms = user.getPermissions();
            return tickets.stream()
                    .filter(t -> t.getAssignedToPermission() == null
                            || employeePerms.contains(t.getAssignedToPermission())
                            || (t.getAssignedToUser() != null && t.getAssignedToUser().getId().equals(user.getId())))
                    .map(ticketMapper::mapToDTO)
                    .collect(Collectors.toList());
        }

        return tickets.stream()
                .map(ticketMapper::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketDetailDTO updateTicketStatus(Long ticketId, TicketStatus status, String adminEmail) {
        return ticketStatusService.updateTicketStatus(ticketId, status, adminEmail);
    }

    @Transactional
    public TicketDetailDTO reopenTicket(Long ticketId, String userEmail) {
        return ticketStatusService.reopenTicket(ticketId, userEmail);
    }

    @Transactional
    public TicketDetailDTO closeTicket(Long ticketId, String userEmail) {
        return ticketStatusService.closeTicket(ticketId, userEmail);
    }

    @Scheduled(cron = "0 0 * * * *") // Runs every hour
    @Transactional
    public void autoCloseResolvedTickets() {
        ticketStatusService.autoCloseResolvedTickets();
    }

    @Transactional
    public TicketDetailDTO assignTicket(Long ticketId, String permissionName, String adminEmail) {
        return ticketAssignmentService.assignTicket(ticketId, permissionName, adminEmail);
    }

    @Transactional
    public TicketDetailDTO claimTicket(Long ticketId, String adminEmail) {
        return ticketAssignmentService.claimTicket(ticketId, adminEmail);
    }

    @Transactional(readOnly = true)
    public List<TicketDTO> getUserActiveTickets(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        List<TicketStatus> activeStatuses = List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS);
        return supportTicketRepository.findByUserAndStatusIn(user, activeStatuses)
                .stream()
                .map(ticketMapper::mapToDTO)
                .collect(Collectors.toList());
    }
}
