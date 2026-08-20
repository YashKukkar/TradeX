package com.tradex.api.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class CsvExportUtils {

    public static final DateTimeFormatter DISPLAY_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final java.util.regex.Pattern PURE_NUMBER_PATTERN = java.util.regex.Pattern.compile("^[+-]?(\\d+(\\.\\d+)?|\\.\\d+)$");
    private static final java.util.regex.Pattern FORMULA_TRIGGER_PATTERN = java.util.regex.Pattern.compile("^[=+\\-@\\t\\r|%]");

    public static String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String str = value.trim();
        if (str.isEmpty()) {
            return "";
        }

        // Neutralize formula injection for non-numeric fields starting with formula trigger characters
        if (!PURE_NUMBER_PATTERN.matcher(str).matches() && FORMULA_TRIGGER_PATTERN.matcher(str).find()) {
            str = "'" + str;
        }

        // Standard RFC 4180 CSV escaping
        if (str.contains(",") || str.contains("\"") || str.contains("\n") || str.contains("\r") || str.contains("'")) {
            str = str.replace("\"", "\"\"");
            return "\"" + str + "\"";
        }
        return str;
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
}
