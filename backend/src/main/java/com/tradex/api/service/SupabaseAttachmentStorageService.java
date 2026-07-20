package com.tradex.api.service;

import com.tradex.api.config.SupabaseProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.util.UUID;

@Service
@Primary
@RequiredArgsConstructor
@Slf4j
public class SupabaseAttachmentStorageService implements AttachmentStorageService {

    private final S3Client s3Client;
    private final SupabaseProperties properties;

    @Override
    public String store(byte[] content, String fileName, String contentType) {
        // Sanitize fileName: replace spaces and non-URL-safe characters with underscores
        String safeFileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String key = UUID.randomUUID().toString() + "_" + safeFileName;
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(key)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(content));
            log.info("[Storage] Upload OK | key={} | size={} bytes", key, content.length);
            return key;
        } catch (S3Exception e) {
            log.error("[Storage] Upload FAILED | key={} | httpStatus={} | errorCode={} | message={}",
                    key, e.statusCode(), e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
            throw new RuntimeException("Failed to upload attachment to storage server", e);
        } catch (Exception e) {
            log.error("[Storage] Upload FAILED | key={} | error={} | message={}", key, e.getClass().getSimpleName(), e.getMessage());
            throw new RuntimeException("Failed to upload attachment to storage server", e);
        }
    }

    @Override
    public byte[] retrieve(String storageKey) {
        log.info("[Storage] Retrieve attempt | bucket={} | key={}", properties.getBucket(), storageKey);
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(storageKey)
                    .build();

            ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(getObjectRequest);
            byte[] data = objectBytes.asByteArray();
            log.info("[Storage] Retrieve OK | key={} | size={} bytes", storageKey, data.length);
            return data;
        } catch (S3Exception e) {
            log.error("[Storage] Retrieve FAILED | bucket={} | key={} | httpStatus={} | errorCode={} | message={}",
                    properties.getBucket(), storageKey,
                    e.statusCode(), e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
            throw new RuntimeException("Failed to retrieve attachment from storage server", e);
        } catch (Exception e) {
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            log.error("[Storage] Retrieve FAILED | bucket={} | key={} | error={} | cause={} | message={}",
                    properties.getBucket(), storageKey,
                    e.getClass().getSimpleName(), cause.getClass().getSimpleName(), cause.getMessage());
            throw new RuntimeException("Failed to retrieve attachment from storage server", e);
        }
    }

    @Override
    public void delete(String storageKey) {
        log.info("[Storage] Delete attempt | key={}", storageKey);
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(storageKey)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("[Storage] Delete OK | key={}", storageKey);
        } catch (S3Exception e) {
            log.error("[Storage] Delete FAILED | key={} | httpStatus={} | errorCode={} | message={}",
                    storageKey, e.statusCode(), e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        } catch (Exception e) {
            log.error("[Storage] Delete FAILED | key={} | error={} | message={}", storageKey, e.getClass().getSimpleName(), e.getMessage());
        }
    }
}
