package com.tradex.api.service.seed;

import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.TicketAttachment;
import com.tradex.api.entity.User;
import com.tradex.api.repository.*;
import com.tradex.api.service.AttachmentStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class CleanupService {

    private final UserRepository userRepository;
    private final PointsTransactionRepository pointsTransactionRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final ReferralRewardRepository referralRewardRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final AttachmentStorageService attachmentStorageService;
    private final TicketHistoryRepository ticketHistoryRepository;

    @Transactional
    public void cleanupTestUsers(List<String> emails) {
        List<User> existingUsers = new ArrayList<>();
        for (String email : emails) {
            userRepository.findByEmail(email).ifPresent(existingUsers::add);
        }

        if (existingUsers.isEmpty()) {
            return;
        }

        // Fetch and wipe support tickets, comments, and attachments for existing test
        // users
        List<SupportTicket> testTickets = new ArrayList<>();
        for (User user : existingUsers) {
            testTickets.addAll(supportTicketRepository.findByUserOrderByCreatedAtDesc(user));
        }

        if (!testTickets.isEmpty()) {
            List<String> storageKeys = testTickets.stream()
                    .flatMap(t -> t.getAttachments().stream())
                    .map(TicketAttachment::getStorageKey)
                    .collect(Collectors.toList());

            // Delete comment entities
            ticketCommentRepository.deleteAll(
                    testTickets.stream().flatMap(t -> t.getComments().stream()).collect(Collectors.toList()));
            // Delete attachment entities
            ticketAttachmentRepository.deleteAll(
                    testTickets.stream().flatMap(t -> t.getAttachments().stream()).collect(Collectors.toList()));
            // Delete ticket history entities
            ticketHistoryRepository.deleteByTicketIn(testTickets);
            // Delete support tickets
            supportTicketRepository.deleteAll(testTickets);
            // Delete binary payloads
            if (!storageKeys.isEmpty()) {
                storageKeys.forEach(attachmentStorageService::delete);
            }
            log.info("Test support tickets and attachments deleted");
        }

        verificationTokenRepository.deleteByUserIn(existingUsers);
        adminAuditLogRepository.deleteAll();
        pointsTransactionRepository.deleteByUserIn(existingUsers);
        walletTransactionRepository.deleteByUserIn(existingUsers);
        referralRewardRepository.deleteByReferrerOrReferredUserIn(existingUsers);

        existingUsers.forEach(user -> user.setReferredBy(null));

        userRepository.saveAll(existingUsers);
        userRepository.deleteAll(existingUsers);
        userRepository.flush();

        log.info("Old test users cleaned successfully");
    }
}
