package com.tradex.api.service.seed;

import com.tradex.api.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeeder {

    private final SeedDataService seedDataService;
    private final AppProperties appProperties;

    public void seedDemoData() {
        if (appProperties.getSeed().isDemoEnabled() && !isRunningInTest()) {
            log.info("Seeding demo transactions and demo system users");
            seedDataService.seedTestData();
        } else {
            log.info("Demo data seeding is disabled by config or profile check");
        }
    }

    private boolean isRunningInTest() {
        return StackWalker.getInstance()
                .walk(frames -> frames.anyMatch(frame -> frame.getClassName().startsWith("org.junit.") ||
                        frame.getClassName().startsWith("org.testng.")));
    }
}
