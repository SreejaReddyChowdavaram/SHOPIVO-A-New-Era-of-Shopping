package com.securecommerce.platform;

import com.securecommerce.platform.category.entity.Category;
import com.securecommerce.platform.category.repository.CategoryRepository;
import com.securecommerce.platform.product.dto.ProductImageUploadResponse;
import com.securecommerce.platform.product.dto.ProductRequest;
import com.securecommerce.platform.product.dto.ProductResponse;
import com.securecommerce.platform.product.entity.Product;
import com.securecommerce.platform.product.repository.ProductRepository;
import com.securecommerce.platform.product.service.ProductImageStorageService;
import com.securecommerce.platform.product.service.ProductService;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ProductImageUploadIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductService productService;
    @Autowired private ProductImageStorageService imageStorageService;
    @Autowired private PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:./data/uploads/products}")
    private String uploadDir;

    private User sellerA;
    private User sellerB;
    private User customer;
    private Category category;
    private Product productA;

    @BeforeEach
    void setUp() throws Exception {
        sellerA = userRepository.save(User.builder()
                .firstName("Seller")
                .lastName("Alpha")
                .email("seller_alpha_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        sellerB = userRepository.save(User.builder()
                .firstName("Seller")
                .lastName("Beta")
                .email("seller_beta_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .role(User.Role.SELLER)
                .enabled(true)
                .build());

        customer = userRepository.save(User.builder()
                .firstName("Charlie")
                .lastName("Customer")
                .email("customer_" + System.nanoTime() + "@shopivo.com")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Audio Devices " + System.nanoTime())
                .slug("audio-devices-" + System.nanoTime())
                .description("Headphones and speakers")
                .active(true)
                .build());

        ProductResponse created = productService.createProduct(sellerA.getId(), new ProductRequest(
                "Noise Cancelling Headphones " + System.nanoTime(),
                "High quality wireless headphones",
                new BigDecimal("2999.00"),
                20,
                "https://example.com/initial-image.jpg",
                category.getId()
        ));

        productA = productRepository.findById(created.id()).orElseThrow();
    }

    private byte[] createSampleImageBytes(String format) throws IOException {
        BufferedImage img = new BufferedImage(50, 50, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, 50, 50);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, format, baos);
        return baos.toByteArray();
    }

    private byte[] createSampleWebpBytes() {
        // Minimal RIFF ... WEBP header payload
        byte[] payload = new byte[30];
        payload[0] = 'R'; payload[1] = 'I'; payload[2] = 'F'; payload[3] = 'F';
        payload[4] = 22; payload[5] = 0; payload[6] = 0; payload[7] = 0;
        payload[8] = 'W'; payload[9] = 'E'; payload[10] = 'B'; payload[11] = 'P';
        payload[12] = 'V'; payload[13] = 'P'; payload[14] = '8'; payload[15] = ' ';
        return payload;
    }

    @Test
    @DisplayName("1. Valid JPEG upload succeeds, stores file on disk and updates product imageUrl")
    void testValidJpegUpload() throws Exception {
        byte[] jpegBytes = createSampleImageBytes("jpeg");
        MockMultipartFile file = new MockMultipartFile(
                "image", "headphone.jpg", "image/jpeg", jpegBytes);

        ProductImageUploadResponse response = productService.uploadProductImage(
                sellerA.getId(), productA.getId(), file);

        assertThat(response).isNotNull();
        assertThat(response.productId()).isEqualTo(productA.getId());
        assertThat(response.imageUrl()).startsWith("/uploads/products/");
        assertThat(response.imageUrl()).endsWith(".jpg");

        // Verify persisted in DB
        Product updated = productRepository.findById(productA.getId()).orElseThrow();
        assertThat(updated.getImageUrl()).isEqualTo(response.imageUrl());

        // Verify file physically exists on disk
        String filename = response.imageUrl().substring("/uploads/products/".length());
        Path diskPath = Paths.get(uploadDir).resolve(filename);
        assertThat(Files.exists(diskPath)).isTrue();
    }

    @Test
    @DisplayName("2. Valid PNG upload succeeds and updates product imageUrl")
    void testValidPngUpload() throws Exception {
        byte[] pngBytes = createSampleImageBytes("png");
        MockMultipartFile file = new MockMultipartFile(
                "image", "camera.png", "image/png", pngBytes);

        ProductImageUploadResponse response = productService.uploadProductImage(
                sellerA.getId(), productA.getId(), file);

        assertThat(response.imageUrl()).startsWith("/uploads/products/");
        assertThat(response.imageUrl()).endsWith(".png");
    }

    @Test
    @DisplayName("3. Valid WEBP upload succeeds and updates product imageUrl")
    void testValidWebpUpload() {
        byte[] webpBytes = createSampleWebpBytes();
        MockMultipartFile file = new MockMultipartFile(
                "image", "device.webp", "image/webp", webpBytes);

        ProductImageUploadResponse response = productService.uploadProductImage(
                sellerA.getId(), productA.getId(), file);

        assertThat(response.imageUrl()).startsWith("/uploads/products/");
        assertThat(response.imageUrl()).endsWith(".webp");
    }

    @Test
    @DisplayName("4. Empty image file is rejected with 400 Bad Request")
    void testEmptyFileRejected() {
        MockMultipartFile file = new MockMultipartFile(
                "image", "empty.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> productService.uploadProductImage(sellerA.getId(), productA.getId(), file))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("No image file provided or file is empty");
    }

    @Test
    @DisplayName("5. Oversized image (> 5 MB) is rejected with 400 Bad Request")
    void testOversizedFileRejected() {
        byte[] largeBytes = new byte[5 * 1024 * 1024 + 1024]; // 5 MB + 1 KB
        MockMultipartFile file = new MockMultipartFile(
                "image", "huge.jpg", "image/jpeg", largeBytes);

        assertThatThrownBy(() -> productService.uploadProductImage(sellerA.getId(), productA.getId(), file))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("File size exceeds the 5 MB maximum limit");
    }

    @Test
    @DisplayName("6. Unsupported format (.txt, .pdf, .exe) is rejected with 400 Bad Request")
    void testUnsupportedFormatRejected() {
        MockMultipartFile textFile = new MockMultipartFile(
                "image", "document.txt", "text/plain", "This is plain text".getBytes());

        assertThatThrownBy(() -> productService.uploadProductImage(sellerA.getId(), productA.getId(), textFile))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Unsupported file extension");

        MockMultipartFile fakePng = new MockMultipartFile(
                "image", "malicious.png", "image/png", "NOT A REAL PNG".getBytes());

        assertThatThrownBy(() -> productService.uploadProductImage(sellerA.getId(), productA.getId(), fakePng))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid image format");
    }

    @Test
    @DisplayName("7. Corrupted image file is rejected with 400 Bad Request")
    void testMalformedImageRejected() {
        // Valid 8-byte PNG signature followed by truncated/corrupt chunk data
        byte[] malformedBytes = new byte[32];
        malformedBytes[0] = (byte)0x89;
        malformedBytes[1] = 0x50;
        malformedBytes[2] = 0x4E;
        malformedBytes[3] = 0x47;
        malformedBytes[4] = 0x0D;
        malformedBytes[5] = 0x0A;
        malformedBytes[6] = 0x1A;
        malformedBytes[7] = 0x0A;

        MockMultipartFile file = new MockMultipartFile(
                "image", "corrupt.png", "image/png", malformedBytes);

        assertThatThrownBy(() -> productService.uploadProductImage(sellerA.getId(), productA.getId(), file))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("unable to decode image data");
    }

    @Test
    @DisplayName("8. Customer cannot upload an image (403 Forbidden)")
    void testCustomerCannotUpload() throws Exception {
        byte[] jpegBytes = createSampleImageBytes("jpeg");
        MockMultipartFile file = new MockMultipartFile("image", "headphone.jpg", "image/jpeg", jpegBytes);

        assertThatThrownBy(() -> productService.uploadProductImage(customer.getId(), productA.getId(), file))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("You are not authorized");
    }

    @Test
    @DisplayName("9. Seller cannot upload an image for another seller's product (403 Forbidden)")
    void testSellerCannotUploadOtherSellerProduct() throws Exception {
        byte[] jpegBytes = createSampleImageBytes("jpeg");
        MockMultipartFile file = new MockMultipartFile("image", "headphone.jpg", "image/jpeg", jpegBytes);

        assertThatThrownBy(() -> productService.uploadProductImage(sellerB.getId(), productA.getId(), file))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("You are not authorized");
    }

    @Test
    @DisplayName("10. Unknown product ID returns 404 Not Found")
    void testUnknownProductIdReturns404() throws Exception {
        byte[] jpegBytes = createSampleImageBytes("jpeg");
        MockMultipartFile file = new MockMultipartFile("image", "headphone.jpg", "image/jpeg", jpegBytes);

        assertThatThrownBy(() -> productService.uploadProductImage(sellerA.getId(), 9999999L, file))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Product not found");
    }

    @Test
    @DisplayName("11. Existing image remains if replacement upload fails")
    void testExistingImagePreservedOnFailedReplacement() {
        String originalUrl = productA.getImageUrl();

        MockMultipartFile badFile = new MockMultipartFile(
                "image", "bad.png", "image/png", "corrupt".getBytes());

        assertThatThrownBy(() -> productService.uploadProductImage(sellerA.getId(), productA.getId(), badFile))
                .isInstanceOf(ResponseStatusException.class);

        Product refreshed = productRepository.findById(productA.getId()).orElseThrow();
        assertThat(refreshed.getImageUrl()).isEqualTo(originalUrl);
    }

    @Test
    @DisplayName("12. Replacement upload updates URL and cleans up old server-managed file")
    void testSuccessfulReplacementCleansUpOldManagedFile() throws Exception {
        // First upload
        byte[] pngBytes = createSampleImageBytes("png");
        MockMultipartFile firstFile = new MockMultipartFile("image", "first.png", "image/png", pngBytes);
        ProductImageUploadResponse res1 = productService.uploadProductImage(sellerA.getId(), productA.getId(), firstFile);

        String firstFilename = res1.imageUrl().substring("/uploads/products/".length());
        Path firstDiskPath = Paths.get(uploadDir).resolve(firstFilename);
        assertThat(Files.exists(firstDiskPath)).isTrue();

        // Second upload (replacement)
        byte[] jpegBytes = createSampleImageBytes("jpeg");
        MockMultipartFile secondFile = new MockMultipartFile("image", "second.jpg", "image/jpeg", jpegBytes);
        ProductImageUploadResponse res2 = productService.uploadProductImage(sellerA.getId(), productA.getId(), secondFile);

        assertThat(res2.imageUrl()).isNotEqualTo(res1.imageUrl());

        // Verify second file exists and first file was cleaned up
        String secondFilename = res2.imageUrl().substring("/uploads/products/".length());
        Path secondDiskPath = Paths.get(uploadDir).resolve(secondFilename);
        assertThat(Files.exists(secondDiskPath)).isTrue();
        assertThat(Files.exists(firstDiskPath)).isFalse();
    }

    @Test
    @DisplayName("13. External image URL remains fully supported")
    void testExternalImageUrlSupported() {
        ProductRequest req = new ProductRequest(
                "Gadget " + System.nanoTime(),
                "Gadget description",
                new BigDecimal("499.00"),
                10,
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                category.getId()
        );

        ProductResponse res = productService.createProduct(sellerA.getId(), req);
        assertThat(res.imageUrl()).isEqualTo("https://images.unsplash.com/photo-1505740420928-5e560c06d30e");
    }

    @Test
    @DisplayName("14. Product moderation visibility remains strictly enforced")
    void testModerationVisibilityWithUploadedImage() throws Exception {
        byte[] jpegBytes = createSampleImageBytes("jpeg");
        MockMultipartFile file = new MockMultipartFile("image", "new.jpg", "image/jpeg", jpegBytes);
        ProductImageUploadResponse uploadRes = productService.uploadProductImage(sellerA.getId(), productA.getId(), file);

        // Product is PENDING by default -> Customer cannot see it yet
        assertThatThrownBy(() -> productService.getApprovedProductById(productA.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Product not found or not yet approved");

        // Admin approves -> Now customer can see it with the uploaded image
        productService.approveProduct(productA.getId());
        ProductResponse approved = productService.getApprovedProductById(productA.getId());
        assertThat(approved.imageUrl()).isEqualTo(uploadRes.imageUrl());
        assertThat(approved.status()).isEqualTo("APPROVED");
    }
}
