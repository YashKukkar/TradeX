package com.tradex.api.config;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AppPropertiesTest {

    @Test
    void testDefaultBranding() {
        AppProperties.Branding branding = new AppProperties.Branding();
        assertEquals("TradeX", branding.getAppName());
        assertEquals("TradeX", branding.getSanitizedAppName());
        assertEquals("support@tradenows.com", branding.getSupportEmail());
        assertEquals("TradeX Technologies Ltd", branding.getLegalName());
    }

    @Test
    void testCustomTenantWhiteLabeling() {
        AppProperties.Branding branding = new AppProperties.Branding();
        branding.setAppName("Apex Trader Pro!");
        branding.setSupportEmail("help@apextrader.com");
        branding.setLegalName("Apex Financial Ltd");

        assertEquals("Apex Trader Pro!", branding.getAppName());
        assertEquals("ApexTraderPro", branding.getSanitizedAppName());
        assertEquals("help@apextrader.com", branding.getSupportEmail());
        assertEquals("Apex Financial Ltd", branding.getLegalName());
    }

    @Test
    void testBlankAndNullResilience() {
        AppProperties.Branding branding = new AppProperties.Branding();
        branding.setAppName("   ");
        branding.setSupportEmail("");
        branding.setLegalName(null);

        assertEquals("TradeX", branding.getAppName());
        assertEquals("TradeX", branding.getSanitizedAppName());
        assertEquals("support@tradenows.com", branding.getSupportEmail());
        assertEquals("TradeX Technologies Ltd", branding.getLegalName());
    }
}
