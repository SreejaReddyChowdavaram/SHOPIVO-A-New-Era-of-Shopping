# Deployment Guide

## SecureCommerce AI

**Status**: Draft — to be completed during deployment phase

---

## Environments

| Environment | Frontend URL | Backend URL | Notes |
|-------------|-------------|-------------|-------|
| Development | http://localhost:5173 | http://localhost:8080 | Local, no Docker required |
| Staging | TBD | TBD | Docker Compose |
| Production | TBD | TBD | Cloud deployment |

---

## Development Deployment (No Docker)

See README.md Quick Start section.

---

## Docker Deployment

```bash
# Build all images
docker compose build

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

---

## Environment Variables Required for Production

```env
# Database
DB_URL=jdbc:postgresql://<host>:5432/securecommerce
DB_USERNAME=<username>
DB_PASSWORD=<strong-password>

# JWT
JWT_SECRET=<minimum-256-bit-base64-secret>
JWT_EXPIRATION_MS=86400000

# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## Pre-Deployment Checklist

- [ ] All tests pass (`./mvnw test`)
- [ ] `ddl-auto` is set to `validate` (not `create` or `update`)
- [ ] Flyway migrations are up to date
- [ ] Secrets are in environment variables, not in code
- [ ] CORS is configured for production domain only
- [ ] Payment gateway is switched from sandbox to production
- [ ] SSL/HTTPS is configured

---

*Detailed deployment instructions will be added during the deployment phase.*
