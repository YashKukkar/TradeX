package com.tradex.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class BackendApplication {

	private final Environment env;

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@EventListener(ApplicationReadyEvent.class)
	public void onReady() {
		String[] profiles = env.getActiveProfiles();
		String activeProfile = profiles.length > 0 ? String.join(", ", profiles) : "default";
		String ddlAuto = env.getProperty("spring.jpa.hibernate.ddl-auto", "not set");
		String datasourceUrl = env.getProperty("spring.datasource.url", "not set");
		String dbType = datasourceUrl.contains("h2") ? "H2 In-Memory": "Remote MySQL";

		log.info("");
		log.info("=======================================================");
		log.info("   TradeX API - Startup Summary");
		log.info("=======================================================");
		log.info("  Profile  : {}", activeProfile);
		log.info("  DDL Auto : {}", ddlAuto);
		log.info("  Database : {}", dbType);
		log.info("  Port     : http://localhost:8080");
		log.info("=======================================================");
		log.info("");
	}
}
