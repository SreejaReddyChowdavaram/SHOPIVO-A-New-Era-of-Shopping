package com.securecommerce.platform.product.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.io.RandomAccessFile;
import java.nio.channels.FileLock;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class ProductImageStorageServiceSeedingTest {

    @TempDir
    Path tempUploadDir;

    @TempDir
    Path tempSeedDir;

    @Test
    @DisplayName("Verify missing seed images are copied and marker file is created upon full success")
    void missingImagesCopiedAndMarkerCreated() throws Exception {
        // Arrange
        Path seed1 = tempSeedDir.resolve("product-1.jpg");
        Path seed2 = tempSeedDir.resolve("product-2.png");
        Files.writeString(seed1, "seed-image-1-bytes", StandardCharsets.UTF_8);
        Files.writeString(seed2, "seed-image-2-bytes", StandardCharsets.UTF_8);

        ProductImageStorageService service = new ProductImageStorageService();
        ReflectionTestUtils.setField(service, "configuredUploadDir", tempUploadDir.toString());
        ReflectionTestUtils.setField(service, "configuredSeedDir", tempSeedDir.toString());
        service.init();

        // Act
        service.initializeSeedImagesAsync().join();

        // Assert
        Path uploaded1 = tempUploadDir.resolve("product-1.jpg");
        Path uploaded2 = tempUploadDir.resolve("product-2.png");
        Path marker = tempUploadDir.resolve(".catalog_seed_completed");

        assertThat(Files.exists(uploaded1)).isTrue();
        assertThat(Files.readString(uploaded1)).isEqualTo("seed-image-1-bytes");
        assertThat(Files.exists(uploaded2)).isTrue();
        assertThat(Files.readString(uploaded2)).isEqualTo("seed-image-2-bytes");

        assertThat(Files.exists(marker)).isTrue();
        String markerContent = Files.readString(marker);
        assertThat(markerContent).contains("catalog_seed_completed_at=");
        assertThat(markerContent).contains("seeded=2");
        assertThat(markerContent).contains("preserved=0");
    }

    @Test
    @DisplayName("Verify existing files in upload directory are NEVER overwritten by seed files")
    void existingFilesAreNeverOverwritten() throws Exception {
        // Arrange: Pre-populate existing user image in upload directory
        Path existingUserFile = tempUploadDir.resolve("product-existing.jpg");
        Files.writeString(existingUserFile, "SELLER_CUSTOM_PRODUCT_DATA", StandardCharsets.UTF_8);

        // Put duplicate filename in seed dir with different content + new seed file
        Path seedDuplicate = tempSeedDir.resolve("product-existing.jpg");
        Path seedNew = tempSeedDir.resolve("product-new.jpg");
        Files.writeString(seedDuplicate, "SEED_DEFAULT_DATA", StandardCharsets.UTF_8);
        Files.writeString(seedNew, "NEW_SEED_DATA", StandardCharsets.UTF_8);

        ProductImageStorageService service = new ProductImageStorageService();
        ReflectionTestUtils.setField(service, "configuredUploadDir", tempUploadDir.toString());
        ReflectionTestUtils.setField(service, "configuredSeedDir", tempSeedDir.toString());
        service.init();

        // Act
        service.initializeSeedImagesAsync().join();

        // Assert: Existing file must preserve original content
        assertThat(Files.readString(existingUserFile)).isEqualTo("SELLER_CUSTOM_PRODUCT_DATA");

        // New file was copied
        Path uploadedNew = tempUploadDir.resolve("product-new.jpg");
        assertThat(Files.exists(uploadedNew)).isTrue();
        assertThat(Files.readString(uploadedNew)).isEqualTo("NEW_SEED_DATA");

        // Marker contains counts
        Path marker = tempUploadDir.resolve(".catalog_seed_completed");
        assertThat(Files.exists(marker)).isTrue();
        String markerContent = Files.readString(marker);
        assertThat(markerContent).contains("seeded=1");
        assertThat(markerContent).contains("preserved=1");
    }

    @Test
    @DisplayName("Verify partial copy failure does NOT create marker and subsequent run completes cleanly")
    void partialCopyFailureDoesNotCreateMarkerAndRecoversOnSubsequentRun() throws Exception {
        // Arrange: Create 2 seed files
        Path seedSuccess = tempSeedDir.resolve("01-success.jpg");
        Path seedLocked = tempSeedDir.resolve("02-locked.jpg");
        Files.writeString(seedSuccess, "SUCCESS_BYTES", StandardCharsets.UTF_8);
        Files.writeString(seedLocked, "LOCKED_BYTES", StandardCharsets.UTF_8);

        ProductImageStorageService service = new ProductImageStorageService();
        ReflectionTestUtils.setField(service, "configuredUploadDir", tempUploadDir.toString());
        ReflectionTestUtils.setField(service, "configuredSeedDir", tempSeedDir.toString());
        service.init();

        Path marker = tempUploadDir.resolve(".catalog_seed_completed");

        // Lock the second seed file exclusively to simulate an I/O failure during copy
        try (RandomAccessFile raf = new RandomAccessFile(seedLocked.toFile(), "rw");
             FileLock lock = raf.getChannel().lock()) {

            // Act 1: Run seeding while an I/O exception occurs on the locked file
            service.initializeSeedImagesAsync().join();

            // Assert 1: First file may have succeeded, but marker must NOT be created
            assertThat(Files.exists(marker)).isFalse();
        }

        // Lock is now released.
        // Act 2: Simulate subsequent application startup / retry
        service.initializeSeedImagesAsync().join();

        // Assert 2: Both files now present, existing file preserved, marker created!
        assertThat(Files.exists(tempUploadDir.resolve("01-success.jpg"))).isTrue();
        assertThat(Files.readString(tempUploadDir.resolve("01-success.jpg"))).isEqualTo("SUCCESS_BYTES");
        assertThat(Files.exists(tempUploadDir.resolve("02-locked.jpg"))).isTrue();
        assertThat(Files.readString(tempUploadDir.resolve("02-locked.jpg"))).isEqualTo("LOCKED_BYTES");

        assertThat(Files.exists(marker)).isTrue();
        String markerContent = Files.readString(marker);
        assertThat(markerContent).contains("catalog_seed_completed_at=");
    }
}
