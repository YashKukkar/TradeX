package com.tradex.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "supabase.s3")
@Setter
public class SupabaseProperties {
    private String endpoint;
    private String accessKey;
    private String secretKey;
    private String region;
    private String bucket;

    private String cleanValue(String val) {
        if (val != null && val.startsWith("\"") && val.endsWith("\"")) {
            return val.substring(1, val.length() - 1);
        }
        return val;
    }

    public String getEndpoint() { return cleanValue(endpoint); }
    public String getAccessKey() { return cleanValue(accessKey); }
    public String getSecretKey() { return cleanValue(secretKey); }
    public String getRegion() { return cleanValue(region); }
    public String getBucket() { return cleanValue(bucket); }
}
