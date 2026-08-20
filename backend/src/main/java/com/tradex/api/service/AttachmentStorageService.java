package com.tradex.api.service;

public interface AttachmentStorageService {
    String store(byte[] content, String fileName, String contentType);
    byte[] retrieve(String storageKey);
    void delete(String storageKey);
    default boolean isOperational() {
        return true;
    }
}
