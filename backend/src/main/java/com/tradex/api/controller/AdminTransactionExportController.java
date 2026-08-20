package com.tradex.api.controller;

import com.tradex.api.service.TransactionExportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/admin/transactions/export")
public class AdminTransactionExportController {

    private static final Logger log = LoggerFactory.getLogger(AdminTransactionExportController.class);
    private final TransactionExportService transactionExportService;

    public AdminTransactionExportController(TransactionExportService transactionExportService) {
        this.transactionExportService = transactionExportService;
    }

    @PreAuthorize("hasAnyAuthority('MANAGE_DEPOSITS', 'ROLE_SUPER_ADMIN')")
    @GetMapping("/deposits")
    public ResponseEntity<byte[]> exportDeposits(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        log.info("Exporting deposits CSV. startDate: {}, endDate: {}", startDate, endDate);
        byte[] csvData = transactionExportService.generateDepositsCsv(startDate, endDate);

        String filename = "TradeX_Deposits_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".csv";
        return buildCsvResponse(csvData, filename);
    }

    @PreAuthorize("hasAnyAuthority('MANAGE_WITHDRAWALS', 'ROLE_SUPER_ADMIN')")
    @GetMapping("/withdrawals")
    public ResponseEntity<byte[]> exportWithdrawals(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        log.info("Exporting withdrawals CSV. startDate: {}, endDate: {}", startDate, endDate);
        byte[] csvData = transactionExportService.generateWithdrawalsCsv(startDate, endDate);

        String filename = "TradeX_Withdrawals_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".csv";
        return buildCsvResponse(csvData, filename);
    }

    @PreAuthorize("hasAnyAuthority('MANAGE_POINTS', 'ROLE_SUPER_ADMIN')")
    @GetMapping("/conversions")
    public ResponseEntity<byte[]> exportPointsConversions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        log.info("Exporting points conversions CSV. startDate: {}, endDate: {}", startDate, endDate);
        byte[] csvData = transactionExportService.generatePointsConversionsCsv(startDate, endDate);

        String filename = "TradeX_PointsConversions_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".csv";
        return buildCsvResponse(csvData, filename);
    }

    private ResponseEntity<byte[]> buildCsvResponse(byte[] data, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(data.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(data);
    }
}
