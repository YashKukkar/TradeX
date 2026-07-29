package com.tradex.api.service.seed;

import com.tradex.api.entity.SupportTicket;
import com.tradex.api.entity.TicketComment;
import com.tradex.api.entity.User;
import com.tradex.api.enums.TicketCategory;
import com.tradex.api.enums.TicketStatus;
import com.tradex.api.repository.SupportTicketRepository;
import com.tradex.api.repository.TicketCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SupportTicketSeeder {

    private final SupportTicketRepository supportTicketRepository;
    private final TicketCommentRepository ticketCommentRepository;

    @Transactional
    public void seedSupportTicket(List<User> seededUsers) {
        User u1 = seededUsers.get(0);
        LocalDateTime now = LocalDateTime.now();

        // Ticket raised yesterday afternoon at 3:22 PM
        LocalDateTime ticketCreatedAt = now.minusDays(1).withHour(15).withMinute(22).withSecond(0).withNano(0);
        LocalDateTime commentAt       = now.minusDays(1).withHour(16).withMinute(5).withSecond(0).withNano(0);

        SupportTicket sampleTicket = SupportTicket.builder()
                .ticketNumber("TKT-00001")
                .user(u1)
                .category(TicketCategory.PAYMENT_ISSUE)
                .subject("Deposit of ₹5000 not showing in wallet")
                .description("I deposited ₹5000 using the gateway but my wallet balance is still zero. Please help.")
                .status(TicketStatus.OPEN)
                .createdAt(ticketCreatedAt)
                .updatedAt(ticketCreatedAt)
                .build();

        sampleTicket = supportTicketRepository.save(sampleTicket);

        TicketComment sampleComment = TicketComment.builder()
                .ticket(sampleTicket)
                .author(u1)
                .message("Also, my bank transaction status is successful. I can provide the receipt if needed.")
                .adminReply(false)
                .createdAt(commentAt)
                .build();
        ticketCommentRepository.save(sampleComment);
    }
}
