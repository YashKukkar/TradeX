package com.tradex.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "tradex")
@Getter
@Setter
public class AppProperties {

    private final Otp otp = new Otp();
    private final Auth auth = new Auth();
    private final Wallet wallet = new Wallet();
    private final Seed seed = new Seed();
    private final Storage storage = new Storage();
    private final Cors cors = new Cors();

    @Getter
    @Setter
    public static class Auth {
        private int maxFailedLoginAttempts = 3;
        private int lockoutDurationMinutes = 60;
        private int maxOtpResendAttemptsPerHour = 5;
    }

    @Getter
    @Setter
    public static class Otp {
        private int expiryMinutes;
        private int maxAttempts;
        private int resendCooldownSeconds;
    }

    @Getter
    @Setter
    public static class Wallet {
        private BigDecimal minWithdrawalAmount;
        private BigDecimal maxWithdrawalAmount;
    }

    @Getter
    @Setter
    public static class Seed {
        private String defaultPassword;
        private long welcomeBonus;
        private String adminEmail;
        private String adminPassword;
        private boolean demoEnabled;
        private boolean resetDb;

        // Default System Settings Config
        private long referralCoinsL1;
        private long referralCoinsL2;
        private long referralCoinsL3;
        private long referralCoinsSubsequent;
        private int referralCoinsLimitTier;
        private String smtpUsername;
        private String smtpPassword;
        private String smtpFromEmail;
        private String smtpFromName;
        private String redirectEmailAddress;
    }

    @Getter
    @Setter
    public static class Storage {
        /** Directory on disk where uploaded files are saved. */
        private String location = "./data/attachments";
        /** Public base URL used to download stored files. */
        private String accessEndpoint = "https://example.com/api/storage";

        public String resolvedAccessEndpoint() {
            String endpoint = accessEndpoint;
            if (endpoint == null || endpoint.isBlank()) {
                endpoint = "https://example.com/api/storage";
            }
            return endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
        }

        public String buildAccessUrl(Long attachmentId) {
            return resolvedAccessEndpoint() + "/" + attachmentId;
        }

        public String servletPath() {
            String endpoint = accessEndpoint == null ? "" : accessEndpoint.trim();
            if (endpoint.isBlank()) {
                return "/api/storage";
            }
            try {
                java.net.URI uri = java.net.URI.create(endpoint);
                if (uri.getScheme() != null) {
                    String path = uri.getPath();
                    if (path == null || path.isBlank() || "/".equals(path)) {
                        return "/api/storage";
                    }
                    return path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
                }
            } catch (IllegalArgumentException ignored) {
                // fall through to relative-path handling
            }
            if (endpoint.startsWith("/")) {
                return endpoint.endsWith("/") && endpoint.length() > 1
                        ? endpoint.substring(0, endpoint.length() - 1)
                        : endpoint;
            }
            return "/api/storage";
        }
    }

    @Getter
    @Setter
    public static class Cors {
        private java.util.List<String> allowedOriginPatterns = new java.util.ArrayList<>(java.util.List.of(
                "http://localhost",
                "http://localhost:*",
                "http://127.0.0.1",
                "http://127.0.0.1:*",
                "https://localhost",
                "https://localhost:*",
                "http://10.0.2.2",
                "http://10.0.2.2:*",
                "http://192.168.*:*",
                "http://10.*:*",
                "https://tradenows.com",
                "https://www.tradenows.com",
                "https://*.tradenows.com"));
    }
}
