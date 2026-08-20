package com.tradex.api.service;

import com.tradex.api.config.AppProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class LocalAttachmentStorageService implements AttachmentStorageService {

    private final Path root;
    private final String accessEndpoint;

    public LocalAttachmentStorageService(AppProperties appProperties) {
        this.root = Paths.get(appProperties.getStorage().getLocation()).toAbsolutePath().normalize();
        String endpoint = appProperties.getStorage().resolvedAccessEndpoint();
        this.accessEndpoint = endpoint;
        try {
            Files.createDirectories(this.root);
            log.info("[Storage] Local attachment directory ready: {} | access-endpoint={}", this.root, this.accessEndpoint);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create attachment storage directory: " + this.root, e);
        }
    }

    public Path getRoot() {
        return root;
    }

    public String getAccessEndpoint() {
        return accessEndpoint;
    }

    public String accessUrl(Long attachmentId) {
        return accessEndpoint + "/" + attachmentId;
    }

    @Override
    public String store(byte[] content, String fileName, String contentType) {
        String safeFileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String key = UUID.randomUUID() + "_" + safeFileName;
        Path target = resolveKey(key);
        try {
            Files.write(target, content);
            log.info("[Storage] Upload OK | key={} | type={} | size={} bytes | path={}",
                    key, contentType, content.length, target);
            return key;
        } catch (IOException e) {
            log.error("[Storage] Upload FAILED | key={} | error={} | message={}",
                    key, e.getClass().getSimpleName(), e.getMessage());
            throw new RuntimeException("Failed to store attachment locally", e);
        }
    }

    @Override
    public byte[] retrieve(String storageKey) {
        Path target = resolveKey(storageKey);
        log.info("[Storage] Retrieve attempt | key={} | path={}", storageKey, target);
        try {
            byte[] data = Files.readAllBytes(target);
            log.info("[Storage] Retrieve OK | key={} | size={} bytes", storageKey, data.length);
            return data;
        } catch (IOException e) {
            log.error("[Storage] Retrieve FAILED | key={} | error={} | message={}",
                    storageKey, e.getClass().getSimpleName(), e.getMessage());
            throw new RuntimeException("Failed to retrieve attachment from local storage", e);
        }
    }

    @Override
    public void delete(String storageKey) {
        Path target = resolveKey(storageKey);
        log.info("[Storage] Delete attempt | key={}", storageKey);
        try {
            boolean deleted = Files.deleteIfExists(target);
            log.info("[Storage] Delete {} | key={}", deleted ? "OK" : "SKIPPED (not found)", storageKey);
        } catch (IOException e) {
            log.error("[Storage] Delete FAILED | key={} | error={} | message={}",
                    storageKey, e.getClass().getSimpleName(), e.getMessage());
        }
    }

    private Path resolveKey(String storageKey) {
        if (storageKey == null || storageKey.isBlank()
                || storageKey.contains("..")
                || storageKey.contains("/")
                || storageKey.contains("\\")) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return target;
    }
}
