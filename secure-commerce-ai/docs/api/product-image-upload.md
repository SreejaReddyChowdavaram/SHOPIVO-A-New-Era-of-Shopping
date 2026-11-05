# SHOPIVO — Product Image Upload & Storage System (Semester 1)

## Overview
Shopivo allows verified **Sellers** to attach visual media to products via:
1. **Direct Photo Upload**: Uploading photos directly from their computer, tablet, or smartphone (including native camera capture and photo gallery selection).
2. **External Image URL**: Providing an existing direct HTTPS image URL from a CDN or external hosting service.

---

## Technical Specifications

| Parameter | Specification |
| :--- | :--- |
| **Supported File Formats** | JPEG (`.jpg`, `.jpeg`), PNG (`.png`), WEBP (`.webp`) |
| **Maximum File Size** | **5 MB** (5,242,880 bytes) |
| **Validation Mechanisms** | File extension check, MIME type check, Magic Header Byte verification, and ImageIO decoding validation |
| **Default Storage Location** | `./data/uploads/products` (relative to backend working directory) |
| **Environment Variable** | `SHOPIVO_UPLOAD_DIR` (overrides default directory) |
| **Public Image URL Pattern** | `/uploads/products/{uuid}.{ext}` |
| **Full URL (Localhost)** | `http://localhost:8080/api/uploads/products/{uuid}.{ext}` |
| **Frontend Dev Proxy** | Vite dev server proxies `/uploads` to `http://localhost:8080/api/uploads` |

---

## API Endpoint Specification

### Upload Product Image
```http
POST /api/seller/products/{productId}/image
Content-Type: multipart/form-data
Authorization: Bearer <SELLER_JWT_TOKEN>
```

#### Request Parameters
- `productId` (path variable, `Long`): The ID of the product.
- `image` (form-data field, `MultipartFile`): The image binary file.

#### Security & Access Control
- **Role Enforcement**: Requires `ROLE_SELLER`.
- **Product Ownership**: The authenticated seller's ID must match the product's `seller_id`. Attempts by customers, other sellers, or unauthorized users are rejected with `403 FORBIDDEN`.
- **Path Traversal Protection**: Uploaded filenames from the client are completely disregarded. The server generates a collision-free `UUID.randomUUID()` filename and verifies that the canonical path stays within the resolved upload directory.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Product image uploaded successfully",
  "data": {
    "productId": 42,
    "imageUrl": "/uploads/products/550e8400-e29b-41d4-a716-446655440000.webp"
  }
}
```

#### Error Responses
- `400 BAD REQUEST`: File is missing/empty, exceeds 5 MB, invalid extension, corrupted bytes, or unsupported MIME type.
- `401 UNAUTHORIZED`: Missing or invalid JWT.
- `403 FORBIDDEN`: User is not the owner of the product or lacks `SELLER` role.
- `404 NOT FOUND`: Product ID does not exist.

---

## Storage & Persistence Architecture

1. **Local Development (Localhost)**:
   - Images are saved to the persistent local disk at `./data/uploads/products`.
   - Spring MVC serves files via `WebConfig` using `ResourceHandlerRegistry` pointing to the normalized file URI.
   - Spring Security permits public `GET /uploads/**` requests so customers, sellers, and admins can view approved product imagery without authentication barriers.
   - Files persist across frontend and backend restarts as long as `./data/uploads/products` remains on the disk.

2. **Production Deployment Requirements**:
   - In containerized environments (Docker, Kubernetes), container filesystems are ephemeral.
   - **Requirement**: Mount a **persistent volume** or configure durable cloud object storage (e.g., AWS S3, Cloudflare R2, Google Cloud Storage) by mapping `SHOPIVO_UPLOAD_DIR` to a mounted persistent volume path (e.g., `/var/data/shopivo/uploads/products`).

---

## Precedence & Workflow Rules
- **Add Product**: Sellers can upload an image or supply an image URL. If both are supplied, the uploaded file takes precedence and is uploaded immediately upon product creation.
- **Edit Product**: Displays the currently active image. Sellers can upload a replacement file or alter the URL. The previous file is safely retained until the new replacement is stored and associated in PostgreSQL.
- **Moderation Workflow**: An uploaded image does not bypass product moderation. Products created or edited remain in `PENDING` status until reviewed and approved by an Administrator.
