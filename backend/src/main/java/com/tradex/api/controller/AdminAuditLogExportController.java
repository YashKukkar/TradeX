package com.tradex.api.controller;

import com.tradex.api.entity.AdminAuditLog;
import com.tradex.api.repository.AdminAuditLogRepository;
import com.tradex.api.util.CsvExportUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditLogExportController {

    private static final Logger log = LoggerFactory.getLogger(AdminAuditLogExportController.class);
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final TransactionTemplate transactionTemplate;

    public AdminAuditLogExportController(
            AdminAuditLogRepository adminAuditLogRepository,
            TransactionTemplate transactionTemplate) {
        this.adminAuditLogRepository = adminAuditLogRepository;
        this.transactionTemplate = transactionTemplate;
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYEE')")
    @GetMapping("/export")
    public ResponseEntity<StreamingResponseBody> exportAuditLogs(
            @RequestParam(required = false) String targetEmail) {

        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HHmmss"));
        String filename = "TradeX_System_Audit_Logs_" + dateStr + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv;charset=utf-8"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());

        StreamingResponseBody stream = outputStream -> {
            try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
                // Write UTF-8 BOM for Microsoft Excel / Google Sheets compatibility
                writer.write('\uFEFF');
                // Write CSV Header
                writer.write("ID,Timestamp,Actor (Admin),Action,Target User,Details\n");

                transactionTemplate.executeWithoutResult(status -> {
                    List<AdminAuditLog> logs = (targetEmail != null && !targetEmail.isBlank())
                            ? adminAuditLogRepository.findByTargetEmailOrderByCreatedAtDesc(targetEmail)
                            : adminAuditLogRepository.findAllByOrderByCreatedAtDesc();

                    int count = 0;
                    for (AdminAuditLog entry : logs) {
                        try {
                            writer.write(String.valueOf(entry.getId()));
                            writer.write(",");
                            writer.write(CsvExportUtils.escapeCsv(CsvExportUtils.formatDate(entry.getCreatedAt())));
                            writer.write(",");
                            writer.write(CsvExportUtils.escapeCsv(entry.getActor() != null ? entry.getActor().getEmail() : "System"));
                            writer.write(",");
                            writer.write(CsvExportUtils.escapeCsv(entry.getAction() != null ? entry.getAction().name() : ""));
                            writer.write(",");
                            writer.write(CsvExportUtils.escapeCsv(entry.getTarget() != null ? entry.getTarget().getEmail() : ""));
                            writer.write(",");
                            writer.write(CsvExportUtils.escapeCsv(entry.getDetails() != null ? entry.getDetails() : "—"));
                            writer.write("\n");

                            count++;
                            if (count % 500 == 0) {
                                writer.flush();
                            }
                        } catch (Exception e) {
                            log.error("Error writing audit log CSV row: {}", e.getMessage());
                        }
                    }
                });

                writer.flush();
            }
        };

        return ResponseEntity.ok()
                .headers(headers)
                .body(stream);
    }
}
