package com.tradex.api.util;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.QuoteMode;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class CsvExportUtils {

    public static final DateTimeFormatter DISPLAY_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final CSVFormat FORMAT = CSVFormat.DEFAULT.builder()
            .setQuoteMode(QuoteMode.MINIMAL)
            .build();

    public static String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String str = value.trim();
        if (str.isEmpty()) {
            return "";
        }
        StringBuilder out = new StringBuilder();
        try {
            FORMAT.print(str, out, true);
        } catch (IOException e) {
            return str;
        }
        return out.toString();
    }

    public static String formatDecimal(BigDecimal val) {
        if (val == null) {
            return "0.00";
        }
        return val.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    public static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(DISPLAY_DATE_FORMATTER);
    }

    public static ResponseEntity<byte[]> toResponseEntity(byte[] data, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv;charset=utf-8"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(data.length);
        return ResponseEntity.ok().headers(headers).body(data);
    }
}
