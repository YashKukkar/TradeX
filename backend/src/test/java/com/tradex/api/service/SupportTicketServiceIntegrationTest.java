package com.tradex.api.service;

import com.tradex.api.dto.*;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.enums.TicketCategory;
import com.tradex.api.enums.TicketStatus;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.exception.AppException.BadRequestException;
import com.tradex.api.exception.AppException.ForbiddenException;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.mockito.Mockito;
import static org.mockito.ArgumentMatchers.any;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional

class SupportTicketServiceIntegrationTest {

    @Autowired
    private SupportTicketService supportTicketService;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private AttachmentStorageService attachmentStorageService;

    private User testUser;
    private User testAdmin;

    @BeforeEach
    void setUp() {
        Mockito.when(attachmentStorageService.store(any(), any(), any())).thenReturn("dummy-key");
        Mockito.when(attachmentStorageService.retrieve(any())).thenReturn("fake image content".getBytes());

        // Create test user
        testUser = User.builder()
                .email("ticket.user@example.com")
                .password("password123")
                .role(Role.USER)
                .emailVerified(true)
                .build();
        testUser = userRepository.save(testUser);

        // Create test admin
        testAdmin = User.builder()
                .email("ticket.admin@example.com")
                .password("password123")
                .role(Role.SUPER_ADMIN)
                .emailVerified(true)
                .build();
        testAdmin = userRepository.save(testAdmin);
    }

    @Test
    void testCreateTicketWithoutAttachments() {
        TicketCreateRequest request = new TicketCreateRequest(
                TicketCategory.GENERAL,
                "Need help resetting password",
                "I cannot reset my password from the settings page.");

        TicketDetailDTO ticket = supportTicketService.createTicket(testUser.getEmail(), request, null);

        assertNotNull(ticket);
        assertNotNull(ticket.getId());
        assertEquals("Need help resetting password", ticket.getSubject());
        assertEquals("I cannot reset my password from the settings page.", ticket.getDescription());
        assertEquals(TicketStatus.OPEN, ticket.getStatus());
        assertEquals(TicketCategory.GENERAL, ticket.getCategory());
        assertEquals(testUser.getEmail(), ticket.getUserEmail());
        assertTrue(ticket.getAttachments().isEmpty());
        assertTrue(ticket.getComments().isEmpty());
        assertNotNull(ticket.getTicketNumber());
        assertTrue(ticket.getTicketNumber().startsWith("TKT-"));
    }

    @Test
    void testCreateTicketWithAttachments() {
        TicketCreateRequest request = new TicketCreateRequest(
                TicketCategory.TECHNICAL,
                "Error loading dashboard",
                "See the attached screenshot of the JS console error.");

        MockMultipartFile file1 = new MockMultipartFile(
                "files",
                "screenshot.png",
                "image/png",
                "fake image content".getBytes());

        List<MultipartFile> files = new ArrayList<>();
        files.add(file1);

        TicketDetailDTO ticket = supportTicketService.createTicket(testUser.getEmail(), request, files);

        assertNotNull(ticket);
        assertEquals(1, ticket.getAttachments().size());

        TicketAttachmentDTO attachment = ticket.getAttachments().getFirst();
        assertTrue(attachment.getFileName().startsWith("screenshot"));
        assertTrue(attachment.getFileName().endsWith(".png"));
        assertEquals("image/png", attachment.getContentType());
        assertTrue(attachment.getFileSize() > 0);

        // Verify attachment download
        AttachmentDownload retrievedDownload = supportTicketService.getAttachmentDownload(testUser.getEmail(),
                attachment.getId());
        assertNotNull(retrievedDownload);
        assertNotNull(retrievedDownload.data());

        // Admin should also be able to download
        AttachmentDownload adminRetrievedDownload = supportTicketService.getAttachmentDownload(testAdmin.getEmail(),
                attachment.getId());
        assertNotNull(adminRetrievedDownload);
        assertNotNull(adminRetrievedDownload.data());
    }

    @Test
    void testGetUserTicketsAndAllTickets() {
        TicketCreateRequest req1 = new TicketCreateRequest(TicketCategory.TECHNICAL, "Subject 1", "Desc 1");
        TicketCreateRequest req2 = new TicketCreateRequest(TicketCategory.GENERAL, "Subject 2", "Desc 2");

        supportTicketService.createTicket(testUser.getEmail(), req1, null);
        supportTicketService.createTicket(testUser.getEmail(), req2, null);

        List<TicketDTO> userTickets = supportTicketService.getUserTickets(testUser.getEmail());
        assertEquals(2, userTickets.size());

        List<TicketDTO> allTickets = supportTicketService.getAllTickets(testAdmin.getEmail());
        assertTrue(allTickets.size() >= 2);
    }

    @Test
    void testAddCommentsAndAutoStatusTransition() {
        TicketCreateRequest request = new TicketCreateRequest(TicketCategory.OTHER, "Test Status",
                "Status transitions");
        TicketDetailDTO ticket = supportTicketService.createTicket(testUser.getEmail(), request, null);

        assertEquals(TicketStatus.OPEN, ticket.getStatus());

        // Admin replies -> Status should auto-transition to IN_PROGRESS
        TicketCommentRequest adminReply = new TicketCommentRequest("We are investigating this issue.");
        TicketCommentDTO adminComment = supportTicketService.addComment(testAdmin.getEmail(), ticket.getId(),
                adminReply, null);

        assertNotNull(adminComment);
        assertTrue(adminComment.isAdminReply());
        assertEquals(testAdmin.getEmail(), adminComment.getAuthorEmail());

        TicketDetailDTO updatedTicket = supportTicketService.getTicketDetail(testUser.getEmail(), ticket.getId());
        assertEquals(TicketStatus.IN_PROGRESS, updatedTicket.getStatus());
        assertEquals(1, updatedTicket.getComments().size());

        // Resolve ticket as admin
        supportTicketService.updateTicketStatus(ticket.getId(), TicketStatus.RESOLVED, testAdmin.getEmail());
        TicketDetailDTO resolvedTicket = supportTicketService.getTicketDetail(testAdmin.getEmail(), ticket.getId());
        assertEquals(TicketStatus.RESOLVED, resolvedTicket.getStatus());
        assertNotNull(resolvedTicket.getResolvedAt());
        assertEquals(testAdmin.getEmail(), resolvedTicket.getResolvedByEmail());

        // Verify customer cannot see resolvedByEmail (privacy rule)
        TicketDetailDTO resolvedTicketCustomer = supportTicketService.getTicketDetail(testUser.getEmail(),
                ticket.getId());
        assertNull(resolvedTicketCustomer.getResolvedByEmail());

        assertThrows(BadRequestException.class, () -> {
            supportTicketService.addComment(testUser.getEmail(), ticket.getId(),
                    new TicketCommentRequest("Should fail"), null);
        });

        supportTicketService.reopenTicket(ticket.getId(), testUser.getEmail());
        TicketDetailDTO reopenedTicket = supportTicketService.getTicketDetail(testUser.getEmail(), ticket.getId());
        assertEquals(TicketStatus.OPEN, reopenedTicket.getStatus());
        assertNull(reopenedTicket.getResolvedAt());

        // User closes the ticket -> transitions to CLOSED
        supportTicketService.closeTicket(ticket.getId(), testUser.getEmail());
        TicketDetailDTO closedTicket = supportTicketService.getTicketDetail(testUser.getEmail(), ticket.getId());
        assertEquals(TicketStatus.CLOSED, closedTicket.getStatus());

        // Replying to closed ticket is blocked
        assertThrows(BadRequestException.class, () -> {
            supportTicketService.addComment(testUser.getEmail(), ticket.getId(),
                    new TicketCommentRequest("Should fail"), null);
        });
    }

    @Test
    void testAddCommentWithAttachments() {
        TicketCreateRequest request = new TicketCreateRequest(TicketCategory.GENERAL, "Attachment Comment Test",
                "Test");
        TicketDetailDTO ticket = supportTicketService.createTicket(testUser.getEmail(), request, null);

        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "files",
                "comment-doc.txt",
                "text/plain",
                "comment file content".getBytes());

        TicketCommentRequest commentReq = new TicketCommentRequest("Here is the requested log file.");
        TicketCommentDTO comment = supportTicketService.addComment(
                testUser.getEmail(),
                ticket.getId(),
                commentReq,
                List.of(file));

        assertNotNull(comment);
        assertEquals("Here is the requested log file.", comment.getMessage());

        TicketDetailDTO updatedTicket = supportTicketService.getTicketDetail(testUser.getEmail(), ticket.getId());
        assertEquals(1, updatedTicket.getAttachments().size());
        String fileName = updatedTicket.getAttachments().get(0).getFileName();
        assertTrue(fileName.startsWith("comment-doc"));
        assertTrue(fileName.endsWith(".txt"));
    }

    @Test
    void testEmployeeTicketVisibilityAndAccessRights() {
        // Create Employee 1 with MANAGE_DEPOSITS
        User employee1 = User.builder()
                .email("emp.deposit@example.com")
                .password("password123")
                .role(Role.EMPLOYEE)
                .permissions(Set.of("MANAGE_DEPOSITS"))
                .emailVerified(true)
                .build();
        employee1 = userRepository.save(employee1);

        // Create Employee 2 with MANAGE_WITHDRAWALS
        User employee2 = User.builder()
                .email("emp.withdrawal@example.com")
                .password("password123")
                .role(Role.EMPLOYEE)
                .permissions(Set.of("MANAGE_WITHDRAWALS"))
                .emailVerified(true)
                .build();
        employee2 = userRepository.save(employee2);

        // Create a ticket
        TicketCreateRequest request = new TicketCreateRequest(TicketCategory.GENERAL, "Deposit Issue", "Details");
        TicketDetailDTO ticket = supportTicketService.createTicket(testUser.getEmail(), request, null);

        // Assign the ticket to MANAGE_DEPOSITS queue
        supportTicketService.assignTicket(ticket.getId(), "MANAGE_DEPOSITS", testAdmin.getEmail());

        // Employee 1 should see it in their list
        List<TicketDTO> emp1Tickets = supportTicketService.getAllTickets(employee1.getEmail());
        assertTrue(emp1Tickets.stream().anyMatch(t -> t.getId().equals(ticket.getId())));

        // Employee 2 should NOT see it in their list
        List<TicketDTO> emp2Tickets = supportTicketService.getAllTickets(employee2.getEmail());
        assertFalse(emp2Tickets.stream().anyMatch(t -> t.getId().equals(ticket.getId())));

        // Employee 2 attempts to claim it -> should throw ForbiddenException
        User finalEmp2 = employee2;
        assertThrows(ForbiddenException.class, () -> {
            supportTicketService.claimTicket(ticket.getId(), finalEmp2.getEmail());
        });

        // Employee 2 attempts to resolve it -> should throw ForbiddenException
        assertThrows(ForbiddenException.class, () -> {
            supportTicketService.updateTicketStatus(ticket.getId(), TicketStatus.RESOLVED, finalEmp2.getEmail());
        });

        // Employee 2 attempts to comment -> should throw ForbiddenException
        assertThrows(ForbiddenException.class, () -> {
            supportTicketService.addComment(finalEmp2.getEmail(), ticket.getId(), new TicketCommentRequest("Hacking"),
                    null);
        });

        // Employee 1 claims it -> should succeed
        TicketDetailDTO claimedByEmp1 = supportTicketService.claimTicket(ticket.getId(), employee1.getEmail());
        assertNotNull(claimedByEmp1.getAssignedToUserEmail());
        assertEquals(employee1.getEmail(), claimedByEmp1.getAssignedToUserEmail());

        // Employee 1 comments -> should succeed
        TicketCommentDTO emp1Comment = supportTicketService.addComment(employee1.getEmail(), ticket.getId(),
                new TicketCommentRequest("Checking deposits"), null);
        assertNotNull(emp1Comment);

        // Employee 1 resolves -> should succeed
        TicketDetailDTO resolvedByEmp1 = supportTicketService.updateTicketStatus(ticket.getId(), TicketStatus.RESOLVED,
                employee1.getEmail());
        assertEquals(TicketStatus.RESOLVED, resolvedByEmp1.getStatus());
    }
}
