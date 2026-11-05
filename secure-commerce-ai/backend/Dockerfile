# ==============================================================================
# SHOPIVO Backend — Production Multi-Stage Dockerfile for Render
# Runtime: Java 21 LTS (Eclipse Temurin)
# Framework: Spring Boot 3.4.3
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. BUILD STAGE: Compile and package the Spring Boot executable fat JAR
# ------------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependency layer
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# Copy source code and build application
COPY src ./src
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# 2. RUNTIME STAGE: Minimal, secure JRE 21 runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Run as non-root user for security
RUN groupadd -r shopivo && useradd -r -g shopivo -m -u 1001 shopivo

# Create upload directory and set ownership
RUN mkdir -p /app/data/uploads/products && \
    chown -R shopivo:shopivo /app

USER shopivo

# Copy built artifact from build stage
COPY --from=build --chown=shopivo:shopivo /app/target/*.jar /app/app.jar

# Render dynamic port and production profile defaults
ENV SPRING_PROFILES_ACTIVE=prod \
    PORT=8080 \
    SHOPIVO_UPLOAD_DIR=/app/data/uploads/products

EXPOSE ${PORT}

# Optimal container memory flags & dynamic port binding
ENTRYPOINT ["sh", "-c", "exec java -Djava.security.egd=file:/dev/./urandom -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT} -jar /app/app.jar"]

