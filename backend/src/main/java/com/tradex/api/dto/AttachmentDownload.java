package com.tradex.api.dto;

public record AttachmentDownload(
    byte[] data,
    String fileName,
    String contentType
) {}
