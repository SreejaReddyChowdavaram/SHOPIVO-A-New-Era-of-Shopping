package com.securecommerce.platform.product.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * ProductImageStorageService — Secure file storage for product images.
 * Enforces size limits, extension checks, MIME validation, magic-byte inspection,
 * path traversal guards, and safe server-side unique filename generation.
 */
@Service
@Slf4j
public class ProductImageStorageService {

    public static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    public static final String PUBLIC_URL_PREFIX = "/uploads/products/";

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/x-png"
    );

    private static final String SEED_MARKER_FILE = ".catalog_seed_completed";

    @Value("${app.upload.dir:./data/uploads/products}")
    private String configuredUploadDir;

    @Value("${app.upload.seed-dir:}")
    private String configuredSeedDir;

    private Path resolvedUploadPath;

    @PostConstruct
    public void init() {
        try {
            resolvedUploadPath = Paths.get(configuredUploadDir).toAbsolutePath().normalize();
            if (Files.notExists(resolvedUploadPath)) {
                Files.createDirectories(resolvedUploadPath);
            }
            log.info("[STARTUP] Product image storage directory ready: {}", resolvedUploadPath);
        } catch (Exception e) {
            log.warn("[STARTUP] Non-fatal: could not pre-create upload directory (will retry on write): {}", e.getMessage());
        }
    }

    /**
     * Initializes bundled/seed product images into the upload directory asynchronously.
     * Runs in the background AFTER the web server is listening so it NEVER blocks
     * Tomcat startup, port binding, or cloud health checks.
     *
     * Guarantees:
     * - Never overwrites or deletes existing files or seller uploads.
     * - Skips re-copying if the seed marker file or populated directory exists.
     * - Uses standard copy (no COPY_ATTRIBUTES) to prevent POSIX attribute stalls on network disks.
     */
    public java.util.concurrent.CompletableFuture<Void> initializeSeedImagesAsync() {
        return java.util.concurrent.CompletableFuture.runAsync(() -> {
            long startTime = System.currentTimeMillis();
            try {
                if (resolvedUploadPath == null) {
                    resolvedUploadPath = Paths.get(configuredUploadDir).toAbsolutePath().normalize();
                }

                if (Files.notExists(resolvedUploadPath)) {
                    Files.createDirectories(resolvedUploadPath);
                }

                Path markerPath = resolvedUploadPath.resolve(SEED_MARKER_FILE);
                if (Files.exists(markerPath)) {
                    log.info("[STARTUP-ASYNC] Product catalog seed images already initialized in {}. Skipping copy.", resolvedUploadPath);
                    return;
                }

                Path seedPath = null;
                if (configuredSeedDir != null && !configuredSeedDir.isBlank()) {
                    seedPath = Paths.get(configuredSeedDir).toAbsolutePath().normalize();
                } else {
                    Path defaultDockerSeed = Paths.get("/app/data/seed-uploads/products");
                    if (Files.exists(defaultDockerSeed)) {
                        seedPath = defaultDockerSeed;
                    }
                }

                if (seedPath != null && Files.exists(seedPath) && Files.isDirectory(seedPath)) {
                    log.info("[STARTUP-ASYNC] Beginning asynchronous catalog seed copy from: {} to: {}", seedPath, resolvedUploadPath);
                    int copiedCount = 0;
                    int skippedCount = 0;
                    boolean fullyCompleted = false;

                    try (var stream = Files.list(seedPath)) {
                        for (Path file : stream.toList()) {
                            if (Files.isRegularFile(file)) {
                                Path targetFile = resolvedUploadPath.resolve(file.getFileName());
                                if (Files.notExists(targetFile)) {
                                    Files.copy(file, targetFile);
                                    copiedCount++;
                                } else {
                                    skippedCount++;
                                }
                            }
                        }
                        fullyCompleted = true;
                    } catch (Exception loopEx) {
                        log.warn("[STARTUP-ASYNC] Interrupted while seeding catalog images after {} copied, {} existing: {}",
                                copiedCount, skippedCount, loopEx.getMessage());
                    }

                    // Create marker file ONLY when the entire directory scan completed without error
                    if (fullyCompleted) {
                        try {
                            Files.writeString(markerPath, "catalog_seed_completed_at=" + java.time.Instant.now() + "\nseeded=" + copiedCount + "\npreserved=" + skippedCount);
                        } catch (Exception markerEx) {
                            log.debug("Could not write seed marker file: {}", markerEx.getMessage());
                        }

                        long durationMs = System.currentTimeMillis() - startTime;
                        log.info("[STARTUP-ASYNC] Product image seeding completed: {} new images copied, {} existing preserved in {} ms.",
                                copiedCount, skippedCount, durationMs);
                    }
                } else {
                    log.info("[STARTUP-ASYNC] No external seed image directory found at {}. Upload directory is ready.", seedPath);
                }
            } catch (Exception e) {
                log.warn("[STARTUP-ASYNC] Non-fatal issue during background image seeding: {}", e.getMessage());
            }
        });
    }

    /**
     * Validates and saves an uploaded product image file to disk.
     * Returns the relative public URL path (e.g. "/uploads/products/{uuid}.{ext}").
     */
    public String storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No image file provided or file is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds the 5 MB maximum limit");
        }

        // 1. Validate file extension
        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename);
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unsupported file extension. Allowed formats: JPEG, PNG, WEBP");
        }

        // 2. Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase(Locale.ROOT).trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unsupported MIME type. Allowed formats: JPEG, PNG, WEBP");
        }

        // 3. Inspect raw bytes & magic header bytes
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read uploaded image bytes");
        }

        if (fileBytes.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file content is empty");
        }

        String detectedFormat = detectFormatFromMagicBytes(fileBytes);
        if (detectedFormat == null || !ALLOWED_EXTENSIONS.contains(detectedFormat)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid image format: file contents do not match a valid JPEG, PNG, or WEBP image");
        }

        // Normalize extension (e.g. "jpeg" -> "jpg")
        String finalExtension = detectedFormat.equals("jpeg") ? "jpg" : detectedFormat;

        // 4. Verify image decodability for JPEG and PNG
        if ("jpg".equals(finalExtension) || "png".equals(finalExtension)) {
            try (InputStream in = new ByteArrayInputStream(fileBytes)) {
                BufferedImage image = ImageIO.read(in);
                if (image == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Malformed image file: unable to decode image data");
                }
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Corrupted image file: unable to decode image data");
            }
        }

        // 5. Generate secure server-side UUID filename
        String uniqueFilename = UUID.randomUUID().toString() + "." + finalExtension;
        Path targetPath = resolvedUploadPath.resolve(uniqueFilename).normalize();

        // 6. Prevent directory traversal
        if (!targetPath.startsWith(resolvedUploadPath)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file storage path");
        }

        // 7. Write file to disk
        try (InputStream inputStream = new ByteArrayInputStream(fileBytes)) {
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to write product image file to disk: {}", targetPath, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store product image file");
        }

        return PUBLIC_URL_PREFIX + uniqueFilename;
    }

    /**
     * Safely deletes an old server-managed image when replaced or updated.
     * External image URLs (e.g. https://...) are never touched.
     */
    public void deleteOldImage(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith(PUBLIC_URL_PREFIX)) {
            return;
        }

        try {
            String filename = imageUrl.substring(PUBLIC_URL_PREFIX.length()).trim();
            if (filename.isEmpty() || filename.contains("/") || filename.contains("\\") || filename.contains("..")) {
                return;
            }

            Path filePath = resolvedUploadPath.resolve(filename).normalize();
            if (filePath.startsWith(resolvedUploadPath)) {
                Files.deleteIfExists(filePath);
                log.info("Deleted previous managed product image file: {}", filename);
            }
        } catch (Exception e) {
            log.warn("Could not delete old product image (non-critical): {}", imageUrl, e);
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || filename.isBlank()) return null;
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) return null;
        return filename.substring(lastDotIndex + 1).toLowerCase(Locale.ROOT).trim();
    }

    /**
     * Inspects magic header bytes to verify the actual file format:
     * - JPEG: FF D8 FF
     * - PNG:  89 50 4E 47 0D 0A 1A 0A
     * - WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
     */
    private String detectFormatFromMagicBytes(byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            return null;
        }

        // JPEG: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "jpg";
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89 && (bytes[1] & 0xFF) == 0x50 &&
            (bytes[2] & 0xFF) == 0x4E && (bytes[3] & 0xFF) == 0x47) {
            return "png";
        }

        // WEBP: "RIFF" at 0..3 and "WEBP" at 8..11
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' &&
            bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "webp";
        }

        return null;
    }
}
