package com.tradex.api.service.seed;

import com.tradex.api.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final AdminSeeder adminSeeder;
    private final SystemSettingsSeeder systemSettingsSeeder;
    private final DemoDataSeeder demoDataSeeder;
    private final AppProperties appProperties;

    @Override
    public void run(String... args) throws Exception {
        log.info("Initializing database setup and migration checks...");

        boolean isH2 = false;
        var dataSource = jdbcTemplate.getDataSource();
        if (dataSource != null) {
            try (var conn = dataSource.getConnection()) {
                String dbName = conn.getMetaData().getDatabaseProductName();
                if (dbName != null && dbName.toLowerCase().contains("h2")) {
                    isH2 = true;
                }
            } catch (Exception e) {
                log.warn("Could not determine database product name: {}", e.getMessage());
            }
        }

        if (appProperties.getSeed().isResetDb()) {
            log.info("Reset DB flag is enabled. Wiping all database tables...");
            try {
                if (isH2) {
                    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
                } else {
                    jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
                }

                // Truncate tables
                jdbcTemplate.execute("TRUNCATE TABLE user_permissions");
                jdbcTemplate.execute("TRUNCATE TABLE user_teams");
                jdbcTemplate.execute("TRUNCATE TABLE ticket_history");
                jdbcTemplate.execute("TRUNCATE TABLE ticket_comments");
                jdbcTemplate.execute("TRUNCATE TABLE ticket_attachments");
                jdbcTemplate.execute("TRUNCATE TABLE support_tickets");
                jdbcTemplate.execute("TRUNCATE TABLE referral_rewards");
                jdbcTemplate.execute("TRUNCATE TABLE points_transactions");
                jdbcTemplate.execute("TRUNCATE TABLE wallet_transactions");
                jdbcTemplate.execute("TRUNCATE TABLE bank_details");
                jdbcTemplate.execute("TRUNCATE TABLE verification_tokens");
                jdbcTemplate.execute("TRUNCATE TABLE admin_audit_log");
                jdbcTemplate.execute("TRUNCATE TABLE system_settings");
                jdbcTemplate.execute("TRUNCATE TABLE teams");
                jdbcTemplate.execute("TRUNCATE TABLE users");

                log.info("All tables truncated successfully.");
            } catch (Exception e) {
                log.error("Failed to truncate database tables: {}", e.getMessage(), e);
            } finally {
                if (isH2) {
                    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
                } else {
                    jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
                }
            }
        }

        // Delegate seeding steps to dedicated seeder components
        adminSeeder.seedAdmin();
        systemSettingsSeeder.seedSettings();
        demoDataSeeder.seedDemoData();

        log.info("Database initialization completed successfully.");
    }
}
