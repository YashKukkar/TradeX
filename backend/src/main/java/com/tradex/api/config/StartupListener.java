package com.tradex.api.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
@RequiredArgsConstructor
@Slf4j
public class StartupListener {

    private final Environment env;
    private final AppProperties appProperties;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        String[] profiles = env.getActiveProfiles();
        String activeProfile = profiles.length > 0 ? String.join(", ", profiles) : "default";
        String ddlAuto = env.getProperty("spring.jpa.hibernate.ddl-auto", "not set");
        String datasourceUrl = env.getProperty("spring.datasource.url", "not set");
        String dbType = datasourceUrl != null && datasourceUrl.contains("h2") ? "H2 In-Memory" : "Remote MySQL";

        Path storageRoot = Paths.get(appProperties.getStorage().getLocation()).toAbsolutePath().normalize();
        String storageStatus;
        try {
            Files.createDirectories(storageRoot);
            storageStatus = Files.isWritable(storageRoot)
                    ? "\u001B[32mREADY\u001B[0m (" + storageRoot + ")"
                    : "\u001B[31mNOT WRITABLE\u001B[0m (" + storageRoot + ")";
        } catch (Exception e) {
            storageStatus = "\u001B[31mFAILED\u001B[0m (" + storageRoot + " | Error: " + e.getMessage() + ")";
        }

        log.info("");
        log.info("=======================================================");
        log.info("   TradeX API - Startup Summary");
        log.info("=======================================================");
        log.info("  Profile  : {}", activeProfile);
        log.info("  DDL Auto : {}", ddlAuto);
        log.info("  Database : {}", dbType);
        log.info("  Storage  : {}", storageStatus);
        log.info("  Access   : {}", appProperties.getStorage().getAccessEndpoint());
        log.info("  Port     : http://localhost:{}", env.getProperty("server.port", "8080"));
        log.info("=======================================================");
        log.info("");
    }
}
