package com.tradex.api.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Iterator;

@Slf4j
public class ImageCompressionUtil {

    private static final int MAX_DIMENSION = 1024;

    // Adaptive quality tiers based on raw file size
    private static final long SMALL_THRESHOLD  = 200 * 1024L;
    private static final long MEDIUM_THRESHOLD = 1 * 1024 * 1024L;

    private static final float QUALITY_HIGH   = 0.90f; // < 200 KB
    private static final float QUALITY_MEDIUM = 0.80f; // 200 KB – 1 MB
    private static final float QUALITY_LOW    = 0.70f; // > 1 MB

    /** Holds the (possibly re-encoded) bytes together with their effective MIME type. */
    public record CompressionResult(byte[] data, String contentType) {}

    public static CompressionResult compressImage(MultipartFile file) throws IOException {
        String originalContentType = file.getContentType() != null
                ? file.getContentType()
                : "application/octet-stream";

        try (InputStream is = file.getInputStream()) {
            byte[] header = is.readNBytes(8);
            if (!isJpeg(header) && !isPng(header)) {
                // Not a recognised image format — pass through unchanged
                byte[] rest = is.readAllBytes();
                return new CompressionResult(concat(header, rest), originalContentType);
            }

            // ImageIO.read needs the stream from position 0, so open a fresh one
            BufferedImage originalImage;
            try (InputStream fullStream = file.getInputStream()) {
                originalImage = ImageIO.read(fullStream);
            }

            if (originalImage == null) {
                log.warn("Failed to parse image from file: {}", file.getOriginalFilename());
                return new CompressionResult(file.getBytes(), originalContentType);
            }

            long rawSize = file.getSize();
            int width  = originalImage.getWidth();
            int height = originalImage.getHeight();
            log.info("Original image dimensions: {}x{}, size: {} bytes", width, height, rawSize);

            BufferedImage targetImage = originalImage;
            boolean needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;

            if (needsResize) {
                double ratio = Math.min((double) MAX_DIMENSION / width, (double) MAX_DIMENSION / height);
                int targetWidth  = (int) Math.round(width  * ratio);
                int targetHeight = (int) Math.round(height * ratio);

                targetImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
                Graphics2D g2d = targetImage.createGraphics();
                g2d.setColor(Color.WHITE);
                g2d.fillRect(0, 0, targetWidth, targetHeight);
                g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                g2d.setRenderingHint(RenderingHints.KEY_RENDERING,     RenderingHints.VALUE_RENDER_QUALITY);
                g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING,  RenderingHints.VALUE_ANTIALIAS_ON);
                g2d.drawImage(originalImage, 0, 0, targetWidth, targetHeight, null);
                g2d.dispose();
                log.info("Resized image to {}x{}", targetWidth, targetHeight);
            } else if (originalImage.getType() != BufferedImage.TYPE_INT_RGB) {
                // JPEG writer requires standard RGB — convert in-place without resizing
                targetImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
                Graphics2D g2d = targetImage.createGraphics();
                g2d.setColor(Color.WHITE);
                g2d.fillRect(0, 0, width, height);
                g2d.drawImage(originalImage, 0, 0, null);
                g2d.dispose();
            }

            float quality = rawSize < SMALL_THRESHOLD  ? QUALITY_HIGH
                          : rawSize < MEDIUM_THRESHOLD ? QUALITY_MEDIUM
                          : QUALITY_LOW;

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                 ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {

                Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
                if (!writers.hasNext()) {
                    throw new IllegalStateException("No JPEG writers found in this JVM");
                }
                ImageWriter writer = writers.next();
                writer.setOutput(ios);

                ImageWriteParam param = writer.getDefaultWriteParam();
                if (param.canWriteCompressed()) {
                    param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    param.setCompressionType("JPEG");
                    param.setCompressionQuality(quality);
                }

                writer.write(null, new IIOImage(targetImage, null, null), param);
                writer.dispose();
                
                ios.flush();

                byte[] compressedBytes = baos.toByteArray();

                if (compressedBytes.length >= rawSize) {
                    log.info("Compression increased file size (original: {}, compressed: {}). Keeping original.",
                            rawSize, compressedBytes.length);
                    return new CompressionResult(file.getBytes(), originalContentType);
                }

                log.info("Compressed image: {} → {} bytes ({} reduction)",
                        rawSize, compressedBytes.length,
                        String.format("%.1f%%", (1.0 - (double) compressedBytes.length / rawSize) * 100));

                // Output bytes are JPEG even if the original was PNG
                return new CompressionResult(compressedBytes, "image/jpeg");
            }
        } catch (Exception e) {
            log.error("Error compressing image '{}', falling back to original bytes",
                    file.getOriginalFilename(), e);
            return new CompressionResult(file.getBytes(), originalContentType);
        }
    }

    private static boolean isJpeg(byte[] header) {
        return header.length >= 3
                && (header[0] & 0xFF) == 0xFF
                && (header[1] & 0xFF) == 0xD8
                && (header[2] & 0xFF) == 0xFF;
    }

    private static boolean isPng(byte[] header) {
        return header.length >= 8
                && (header[0] & 0xFF) == 0x89
                && (header[1] & 0xFF) == 0x50
                && (header[2] & 0xFF) == 0x4E
                && (header[3] & 0xFF) == 0x47
                && (header[4] & 0xFF) == 0x0D
                && (header[5] & 0xFF) == 0x0A
                && (header[6] & 0xFF) == 0x1A
                && (header[7] & 0xFF) == 0x0A;
    }

    private static byte[] concat(byte[] a, byte[] b) {
        byte[] result = new byte[a.length + b.length];
        System.arraycopy(a, 0, result, 0, a.length);
        System.arraycopy(b, 0, result, a.length, b.length);
        return result;
    }

    public static String getEffectiveFileName(String originalName, String contentType) {
        if (originalName == null || contentType == null) {
            return originalName;
        }
        if ("image/jpeg".equals(contentType)) {
            String lower = originalName.toLowerCase();
            if (lower.endsWith(".png")) {
                return originalName.substring(0, originalName.length() - 4) + ".jpg";
            } else if (lower.endsWith(".webp")) {
                return originalName.substring(0, originalName.length() - 5) + ".jpg";
            }
        }
        return originalName;
    }
}
