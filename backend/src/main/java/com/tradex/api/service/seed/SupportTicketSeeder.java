package com.tradex.api.service.seed;

import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.TicketComment;
import com.tradex.api.entity.User;
import com.tradex.api.enums.TicketCategory;
import com.tradex.api.enums.TicketStatus;
import com.tradex.api.repository.SupportTicketRepository;
import com.tradex.api.repository.TicketCommentRepository;
import com.tradex.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportTicketSeeder {

    private final SupportTicketRepository supportTicketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final UserRepository userRepository;

    @Transactional
    public void seedSupportTicket(List<User> seededUsers) {
        User u1 = seededUsers.get(0);
        User u2 = seededUsers.get(1);
        LocalDateTime now = LocalDateTime.now();

        // Look up support staff operator (Karan Malhotra)
        User staffKaran = userRepository.findByEmail("e1@tradex.com").orElse(null);

        // ── 1. Open Ticket (Pending in Support Queue) ──
        LocalDateTime t1CreatedAt = now.minusDays(1).withHour(15).withMinute(22).withSecond(0).withNano(0);
        LocalDateTime t1CommentAt = now.minusDays(1).withHour(16).withMinute(5).withSecond(0).withNano(0);

        SupportTicket openTicket = SupportTicket.builder()
                .ticketNumber("TKT-00001")
                .user(u1)
                .category(TicketCategory.PAYMENT_ISSUE)
                .subject("Deposit of ₹5000 not showing in wallet")
                .description("I deposited ₹5000 using the gateway but my wallet balance is still zero. Please help.")
                .status(TicketStatus.OPEN)
                .createdAt(t1CreatedAt)
                .updatedAt(t1CreatedAt)
                .build();

        openTicket = supportTicketRepository.save(openTicket);

        TicketComment comment1 = TicketComment.builder()
                .ticket(openTicket)
                .author(u1)
                .message("Also, my bank transaction status is successful. I can provide the receipt if needed.")
                .adminReply(false)
                .createdAt(t1CommentAt)
                .build();
        ticketCommentRepository.save(comment1);

        // ── 2. Resolved Ticket (Handled and closed by Staff Karan) ──
        LocalDateTime t2CreatedAt = now.minusDays(2).withHour(11).withMinute(10).withSecond(0).withNano(0);
        LocalDateTime t2ClaimedAt = t2CreatedAt.plusMinutes(8);
        LocalDateTime t2ResolvedAt = t2CreatedAt.plusMinutes(24);

        SupportTicket resolvedTicket = SupportTicket.builder()
                .ticketNumber("TKT-00002")
                .user(u2)
                .category(TicketCategory.GENERAL)
                .subject("How do multi-tier referral points get credited?")
                .description("Can you explain how points from Level 2 referrals are calculated?")
                .status(TicketStatus.RESOLVED)
                .assignedToUser(staffKaran)
                .claimedAt(t2ClaimedAt)
                .resolvedAt(t2ResolvedAt)
                .resolvedBy(staffKaran)
                .createdAt(t2CreatedAt)
                .updatedAt(t2ResolvedAt)
                .build();

        resolvedTicket = supportTicketRepository.save(resolvedTicket);

        TicketComment staffReply = TicketComment.builder()
                .ticket(resolvedTicket)
                .author(staffKaran != null ? staffKaran : u2)
                .message("Hi Vihaan, Level 1 gives 500 pts, Level 2 gives 200 pts, and Level 3 gives 100 pts on each verified registration. Your referral ledger has now been updated.")
                .adminReply(true)
                .createdAt(t2ResolvedAt)
                .build();
        ticketCommentRepository.save(staffReply);
    }
}
