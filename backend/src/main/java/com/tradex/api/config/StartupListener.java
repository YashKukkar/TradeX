package com.tradex.api.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;

@Component
@RequiredArgsConstructor
@Slf4j
public class StartupListener {

    private final Environment env;
    private final SupabaseProperties supabaseProperties;
    private final S3Client s3Client;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        String[] profiles = env.getActiveProfiles();
        String activeProfile = profiles.length > 0 ? String.join(", ", profiles) : "default";
        String ddlAuto = env.getProperty("spring.jpa.hibernate.ddl-auto", "not set");
        String datasourceUrl = env.getProperty("spring.datasource.url", "not set");
        String dbType = datasourceUrl != null && datasourceUrl.contains("h2") ? "H2 In-Memory" : "Remote MySQL";

        String supabaseStatus;
        try {
            String bucket = supabaseProperties.getBucket();
            if (bucket != null && !bucket.isBlank()) {
                s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
                supabaseStatus = "\u001B[32mCONNECTED\u001B[0m (" + bucket + ")";
            } else {
                supabaseStatus = "Not Configured";
            }
        } catch (Exception e) {
            supabaseStatus = "\u001B[31mFAILED\u001B[0m (" + supabaseProperties.getBucket() + " | Error: " + e.getMessage() + ")";
        }

        log.info("");
        log.info("=======================================================");
        log.info("   TradeX API - Startup Summary");
        log.info("=======================================================");
        log.info("  Profile  : {}", activeProfile);
        log.info("  DDL Auto : {}", ddlAuto);
        log.info("  Database : {}", dbType);
        log.info("  Supabase : {}", supabaseStatus);
        log.info("  Port     : http://localhost:8080");
        log.info("=======================================================");
        log.info("");
    }
}
