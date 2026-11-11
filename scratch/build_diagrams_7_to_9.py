import os
import html
from generate_full_suite import wrap_svg, card, conn, make_drawio, OUT_DIR

# ==============================================================================
# DIAGRAM 7: SEMESTER 2 LOGIN ACTIVITY ARCHITECTURE
# ==============================================================================
def gen_diagram_7():
    w, h = 1600, 980
    title = "Semester 2 Login Activity & Telemetry Architecture"
    subtitle = "Enterprise authentication telemetry: Render proxy IP resolution, geolocation caching, login count incrementation, self-service activity, and admin audits"

    content = """
    <!-- TIER 1: CLIENT ACCESS & SECURITY VIEWS -->
    <rect x="50" y="115" width="1500" height="150" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="70" y="138" fill="#38bdf8" font-size="11" font-weight="700" letter-spacing="1">TIER 1: CLIENT SECURITY &amp; AUDIT VIEWS (REACT 19)</text>
    """
    content += card(70, 150, 440, 100, "Customer Security View", [
        "Route: /customer/login-activity",
        "Scoped to authenticated user (GET /api/auth/login-history)",
        "Shows sign-in count, IP, device, approx. location & privacy notice"
    ], badge="CUSTOMER", badge_col="#38bdf8")

    content += card(540, 150, 440, 100, "Seller Security View", [
        "Route: /seller/login-activity",
        "Scoped to authenticated merchant (GET /api/auth/login-history)",
        "Inspect store login security, active sessions, and client devices"
    ], badge="SELLER", badge_col="#04DB7E")

    content += card(1010, 150, 520, 100, "Admin Telemetry Dashboard", [
        "Route: /admin/login-history",
        "Platform-wide audit trail (GET /api/admin/login-events)",
        "Multi-attribute filtering, search, pagination, and data retention purge"
    ], badge="ADMIN AUDIT", badge_col="#f43f5e", highlight=True)

    content += """
    <!-- TIER 2: INGRESS CONTEXT & PROXY RESOLUTION -->
    <rect x="50" y="285" width="1500" height="160" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="70" y="308" fill="#04DB7E" font-size="11" font-weight="700" letter-spacing="1">TIER 2: RENDER PROXY UNWRAPPING, CLIENT VALIDATION &amp; GEOLOCATION</text>
    """
    content += card(70, 320, 440, 110, "EventContextResolver (Proxy IP)", [
        "Extracts X-Forwarded-For: &lt;client-ip&gt;, &lt;proxy-1&gt;",
        "Extracts first non-internal IP when trusted-proxy-enabled",
        "Falls back safely to HttpServletRequest.getRemoteAddr()",
        "Detects IPv4 vs IPv6 format automatically"
    ], badge="CONTEXT RESOLVER", badge_col="#04DB7E", highlight=True)

    content += card(540, 320, 440, 110, "IpGeolocationService (Resilient Geo)", [
        "Detects Loopback & Private Subnets (127.0.0.1, 10.*, 192.168.*)",
        "Sets status='LOCAL_DEV', City='Localhost', Country='Local'",
        "Queries IP-API with non-blocking 1.5s connection/read timeout",
        "Extracts Country, State/Region, City, ISP, and ASN"
    ], badge="GEOLOCATION", badge_col="#04DB7E")

    content += card(1010, 320, 520, 110, "Caching & Non-Blocking Fallback", [
        "ConcurrentHashMap in-memory LRU cache with TTL eviction",
        "Prevents external API rate-limiting or latency during login spikes",
        "If timeout/offline: Sets status='UNAVAILABLE', preserves login flow",
        "Zero blocking: Network lookup failure NEVER interrupts authentication"
    ], badge="RESILIENCE", badge_col="#f59e0b")

    content += """
    <!-- TIER 3: SERVICE LOGIC & TELEMETRY RECORDING -->
    <rect x="50" y="465" width="1500" height="175" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="70" y="488" fill="#a855f7" font-size="11" font-weight="700" letter-spacing="1">TIER 3: CORE LOGIN ACTIVITY SERVICE &amp; METRIC MANAGEMENT</text>
    """
    content += card(70, 500, 440, 125, "recordLoginSuccess(user, method)", [
        "Increments users.login_count = login_count + 1",
        "Updates users.last_login_at, last_login_ip, last_login_location",
        "Parses User-Agent into Browser, OS, and DeviceType (Desktop/Mobile)",
        "Saves UserLoginEvent with loginResult='SUCCESS' & failureReason=null"
    ], badge="SUCCESS TRACKER", badge_col="#04DB7E", highlight=True)

    content += card(540, 500, 440, 125, "recordLoginFailure(email, role, method, reason)", [
        "NEVER increments users.login_count (Preserves metric integrity)",
        "Captures attempted email, role, and client network fingerprint",
        "Records failure reason: USER_NOT_FOUND, INVALID_CREDENTIALS, ROLE_MISMATCH",
        "Saves UserLoginEvent with loginResult='FAILED' for threat detection"
    ], badge="FAILURE TRACKER", badge_col="#f43f5e", highlight=True)

    content += card(1010, 500, 520, 125, "Admin Query & Retention Purge", [
        "Admin multi-attribute filtering via Spring Data JPA Specification",
        "Filters: role (ALL/CUSTOMER/SELLER/ADMIN), result, method, search",
        "getLoginStatistics(): Total Success, Total Failed, Platform Success Rate",
        "cleanupOldLoginEvents(retentionDays): Purges historical events older than cutoff"
    ], badge="AUDIT SERVICE", badge_col="#a855f7")

    content += """
    <!-- TIER 4: PERSISTENCE & DATABASE SCHEMA -->
    <rect x="50" y="660" width="1500" height="260" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="70" y="683" fill="#04DB7E" font-size="11" font-weight="700" letter-spacing="1">TIER 4: DATABASE SCHEMA &amp; OPTIMIZED INDEX ARCHITECTURE (POSTGRESQL)</text>
    """
    content += card(70, 700, 440, 205, "users Table Schema Updates (V22)", [
        "login_count INT DEFAULT 0 NOT NULL",
        "last_login_at TIMESTAMP WITH TIME ZONE",
        "last_login_ip VARCHAR(45)",
        "last_login_location VARCHAR(255)",
        "Flyway Migration: V22__create_user_login_events_table.sql",
        "Hibernate validation + persistent account-level metrics",
        "Zero performance overhead during standard read queries"
    ], badge="SCHEMA: USERS", badge_col="#38bdf8")

    content += card(540, 700, 440, 205, "user_login_events Table Schema", [
        "id BIGSERIAL PRIMARY KEY",
        "user_id BIGINT (FK -> users.id, nullable for unknown user attempts)",
        "user_email VARCHAR(255) NOT NULL, user_role VARCHAR(50)",
        "auth_method VARCHAR(50), login_timestamp TIMESTAMP NOT NULL",
        "ip_address VARCHAR(45), ip_version VARCHAR(10)",
        "country, state_region, city, location_status VARCHAR(50)",
        "browser, operating_system, device_type, login_result, failure_reason"
    ], badge="SCHEMA: EVENTS", badge_col="#04DB7E", highlight=True)

    content += card(1010, 700, 520, 205, "High-Performance Compound Indexes", [
        "idx_login_events_user_id: ON (user_id) -> Sub-millisecond self-history queries",
        "idx_login_events_email: ON (user_email) -> Fast threat investigation by email",
        "idx_login_events_result_timestamp: ON (login_result, login_timestamp DESC)",
        "  -> Instantaneous sorting for admin success/failure filtering",
        "idx_login_events_ip: ON (ip_address) -> Rapid brute-force IP cluster search",
        "Enables instant pagination even across millions of authentication records",
        "Full support for high-throughput automated retention delete operations"
    ], badge="DATABASE INDEXES", badge_col="#f59e0b")

    # Connectors
    content += conn(290, 250, 290, 320, "Resolve IP", col="#04DB7E")
    content += conn(760, 250, 760, 320, "Lookup Geo", col="#04DB7E")
    content += conn(1270, 250, 1270, 320, "Audit Query", col="#f43f5e")

    content += conn(290, 430, 290, 500, "Success Data", col="#04DB7E")
    content += conn(760, 430, 760, 500, "Failure Data", col="#f43f5e")
    content += conn(1270, 430, 1270, 500, "Paginated Filter", col="#a855f7")

    content += conn(290, 625, 290, 700, "Update Metrics", col="#38bdf8")
    content += conn(760, 625, 760, 700, "INSERT Event", col="#04DB7E")
    content += conn(1270, 625, 1270, 700, "Indexed Query", col="#f59e0b")

    svg_data = wrap_svg(w, h, title, subtitle, content)
    with open(os.path.join(OUT_DIR, "07-login-activity-architecture.svg"), "w", encoding="utf-8") as f:
        f.write(svg_data)

    cells = """
        <mxCell id="la1" value="Customer Security View (/customer/login-activity)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="70" y="150" width="440" height="100" as="geometry"/></mxCell>
        <mxCell id="la2" value="Seller Security View (/seller/login-activity)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="540" y="150" width="440" height="100" as="geometry"/></mxCell>
        <mxCell id="la3" value="Admin Telemetry Dashboard (/admin/login-history)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f43f5e;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1010" y="150" width="520" height="100" as="geometry"/></mxCell>
        <mxCell id="la4" value="EventContextResolver (Proxy IP Extraction)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="70" y="320" width="440" height="110" as="geometry"/></mxCell>
        <mxCell id="la5" value="IpGeolocationService (Caching &amp; Fallback)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="540" y="320" width="440" height="110" as="geometry"/></mxCell>
        <mxCell id="la6" value="LoginActivityService (Success &amp; Failure Tracking)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#a855f7;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="70" y="500" width="1460" height="125" as="geometry"/></mxCell>
        <mxCell id="la7" value="PostgreSQL Schema (users + user_login_events + indexes)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="70" y="700" width="1460" height="205" as="geometry"/></mxCell>
    """
    with open(os.path.join(OUT_DIR, "07-login-activity-architecture.drawio"), "w", encoding="utf-8") as f:
        f.write(make_drawio(title, cells))

    print("Generated Diagram 7: Login Activity Architecture")

# ==============================================================================
# DIAGRAM 8: LOGIN SECURITY AND PRIVACY WORKFLOW
# ==============================================================================
def gen_diagram_8():
    w, h = 1600, 960
    title = "Authentication Security, Threat Mitigation & Privacy Safeguards"
    subtitle = "Defense-in-depth security principles: brute-force mitigation, cross-role tampering defense, privacy-compliant geolocation, zero-credential logging, and data retention"

    content = """
    <!-- 3 COLUMNS: THREAT MITIGATION, PRIVACY COMPLIANCE, DATA GOVERNANCE -->
    """
    # Column 1: Threat Mitigation
    content += """
    <rect x="50" y="115" width="470" height="800" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="70" y="142" fill="#f43f5e" font-size="12" font-weight="700" letter-spacing="1">1. THREAT MITIGATION &amp; DEFENSE-IN-DEPTH</text>
    """
    content += card(70, 160, 430, 170, "RateLimitingFilter Ingress Defense", [
        "Filters all traffic targeting /api/auth/**",
        "Enforces sliding window limit: 5 requests / min per client IP",
        "Mitigates automated dictionary attacks and password spraying",
        "Prevents database exhaustion during malicious traffic bursts",
        "Returns HTTP 429 TOO_MANY_REQUESTS on limit violation",
        "Emits security alert telemetry with offending IP address"
    ], badge="FIREWALL", badge_col="#f43f5e", highlight=True)

    content += card(70, 350, 430, 175, "Cross-Portal Privilege Boundary", [
        "Strict verification: User role must match target portal role",
        "Customer attempting Seller portal is rejected (HTTP 409 Conflict)",
        "Customer/Seller attempting Admin portal is rejected (HTTP 401/403)",
        "Admin role CANNOT authenticate via Google OAuth (Strictly blocked)",
        "Prevents unauthorized merchant store takeovers",
        "Prevents privilege escalation to platform administration"
    ], badge="ACCESS CONTROL", badge_col="#f43f5e")

    content += card(70, 545, 430, 175, "Brute-Force & Account Lockout Guard", [
        "Failed attempts tracked independently in user_login_events",
        "Captures exact failure reason code without leaking account existence",
        "Count query: countFailedAttemptsSince(email, 15_minutes_ago)",
        "Exceeding 5 failures raises high-priority security alarm",
        "Prevents credential stuffing attacks on customer & seller accounts",
        "Admin can instantly suspend compromised accounts via /admin/users"
    ], badge="BRUTE FORCE GUARD", badge_col="#f43f5e")

    content += card(70, 740, 430, 155, "Timing-Attack Mitigation", [
        "Uniform HTTP response latency regardless of account existence",
        "BCrypt comparison executed on dummy salt for non-existent users",
        "Eliminates timing side-channels during email enumeration scans",
        "Prevents attackers from probing registered customer or merchant lists"
    ], badge="CRYPTOGRAPHY", badge_col="#f43f5e")

    # Column 2: Privacy Safeguards
    content += """
    <rect x="545" y="115" width="470" height="800" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="565" y="142" fill="#04DB7E" font-size="12" font-weight="700" letter-spacing="1">2. PRIVACY-BY-DESIGN &amp; TRANSPARENCY</text>
    """
    content += card(565, 160, 430, 170, "Approximate Geolocation Policy", [
        "Location resolved exclusively via network IP routing databases",
        "Provides approximate City and Country level information ONLY",
        "ZERO physical GPS access, Wi-Fi triangulation, or sensor tracking",
        "Respects user privacy while providing meaningful security context",
        "Transparent privacy banner displayed across all user security views",
        "Complies with Indian Digital Personal Data Protection (DPDP) Act"
    ], badge="PRIVACY POLICY", badge_col="#04DB7E", highlight=True)

    content += card(565, 350, 430, 175, "Zero Sensitive Credential Logging", [
        "Strict sanitization: Passwords NEVER stored in plain-text or logs",
        "OTPs, JWT bearer tokens, and SMTP keys NEVER written to database",
        "EventLoggingService sanitizes payloads before persisting to user_events",
        "UserLoginEvent records only authentication outcome and metadata",
        "Protects database backups against sensitive credential leakage",
        "Eliminates risk of credential exposure through log aggregators"
    ], badge="ZERO-KNOWLEDGE", badge_col="#04DB7E")

    content += card(565, 545, 430, 175, "Loopback & Private Network Anonymity", [
        "Localhost / RFC 1918 private ranges detected immediately",
        "Loopback (127.0.0.1, ::1) logged with status='LOCAL_DEV'",
        "Private IPs (10.*, 192.168.*, 172.16.*) masked from public APIs",
        "Prevents internal network topology leaks to external services",
        "Maintains clean development and testing environment telemetry"
    ], badge="NETWORK MASKING", badge_col="#04DB7E")

    content += card(565, 740, 430, 155, "User Transparency & Consent", [
        "Customer and Seller dashboards prominently explain telemetry purpose",
        "Notice informs users how login history protects their accounts",
        "Clear explanation of why IP and approximate location are captured",
        "Fosters user trust and aligns with enterprise security best practices"
    ], badge="CONSENT", badge_col="#04DB7E")

    # Column 3: Data Governance
    content += """
    <rect x="1040" y="115" width="510" height="800" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="1060" y="142" fill="#38bdf8" font-size="12" font-weight="700" letter-spacing="1">3. DATA GOVERNANCE, RETENTION &amp; AUDITING</text>
    """
    content += card(1060, 160, 470, 170, "Strict Authorization Scoping", [
        "Self-Access Only: Customers can ONLY see their own login activity",
        "Merchants can ONLY inspect their own store authentication history",
        "Enforced by @AuthenticationPrincipal User currentUser in controllers",
        "Spring Security verifies user ID against query parameter",
        "Cross-user history inspection attempts return HTTP 403 FORBIDDEN",
        "Zero horizontal privilege escalation vulnerability"
    ], badge="ROLE ISOLATION", badge_col="#38bdf8", highlight=True)

    content += card(1060, 350, 470, 175, "Administrative Audit & Supervision", [
        "Admin role possesses read-only supervisory access to all login events",
        "Paginated search across millions of records with sub-second response",
        "Filter by role, login status (SUCCESS/FAILED), auth method, or search",
        "Inspect IP address clusters to identify coordinated attack campaigns",
        "Review device type, operating system, and browser distributions",
        "Export audit journals for regulatory compliance or faculty inspection"
    ], badge="SUPERVISION", badge_col="#38bdf8")

    content += card(1060, 545, 470, 175, "Configurable Data Retention Purge", [
        "Enables automated and administrator-triggered data retention hygiene",
        "Retention threshold options: 90 days, 180 days, 365 days, 730 days",
        "Indexed deletion: DELETE FROM user_login_events WHERE login_timestamp < :cutoff",
        "Protects persistent user account metrics: login_count preserved forever",
        "Maintains lean database storage footprints on Render Cloud",
        "Ensures compliance with statutory data minimization requirements"
    ], badge="RETENTION PURGE", badge_col="#38bdf8")

    content += card(1060, 740, 470, 155, "Semester 2 AI Research Data Pipeline", [
        "Aggregates login history, cart behavior, and checkout transactions",
        "Constructs multi-dimensional behavioral features for ML models",
        "Enables training of supervised models for account takeover detection",
        "Forms core intellectual contribution for college faculty evaluation"
    ], badge="RESEARCH PIPELINE", badge_col="#a855f7")

    svg_data = wrap_svg(w, h, title, subtitle, content)
    with open(os.path.join(OUT_DIR, "08-security-privacy-workflow.svg"), "w", encoding="utf-8") as f:
        f.write(svg_data)

    cells = """
        <mxCell id="sec1" value="Column 1: Threat Mitigation &amp; Defense-in-Depth" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f43f5e;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="115" width="470" height="800" as="geometry"/></mxCell>
        <mxCell id="sec2" value="Column 2: Privacy-by-Design &amp; Transparency" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="545" y="115" width="470" height="800" as="geometry"/></mxCell>
        <mxCell id="sec3" value="Column 3: Data Governance, Retention &amp; Auditing" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1040" y="115" width="510" height="800" as="geometry"/></mxCell>
    """
    with open(os.path.join(OUT_DIR, "08-security-privacy-workflow.drawio"), "w", encoding="utf-8") as f:
        f.write(make_drawio(title, cells))

    print("Generated Diagram 8: Security & Privacy Workflow")

# ==============================================================================
# DIAGRAM 9: DATABASE ARCHITECTURE (ALL MAJOR ENTITIES)
# ==============================================================================
def gen_diagram_9():
    w, h = 1600, 1020
    title = "Relational Database Schema & Entity-Relationship Architecture"
    subtitle = "PostgreSQL multi-vendor database model: 10 major entities, primary/foreign key relationships, Flyway migrations (V1-V22), and telemetry tables"

    content = """
    <!-- ROW 1: USERS, LOGIN EVENTS, ADDRESSES -->
    """
    content += card(50, 120, 450, 240, "users (Core Account Entity)", [
        "id BIGSERIAL PRIMARY KEY",
        "email VARCHAR(255) UNIQUE NOT NULL (Indexed)",
        "password_hash VARCHAR(255) NOT NULL (BCrypt)",
        "first_name VARCHAR(100), last_name VARCHAR(100)",
        "role VARCHAR(50) NOT NULL (CUSTOMER, SELLER, ADMIN)",
        "enabled BOOLEAN DEFAULT TRUE NOT NULL",
        "login_count INT DEFAULT 0 NOT NULL (V22 Column)",
        "last_login_at TIMESTAMP WITH TIME ZONE (V22 Column)",
        "last_login_ip VARCHAR(45) (V22 Column)",
        "last_login_location VARCHAR(255) (V22 Column)"
    ], badge="ENTITY 1", badge_col="#04DB7E", highlight=True)

    content += card(530, 120, 520, 240, "user_login_events (V22 Dedicated Audit Entity)", [
        "id BIGSERIAL PRIMARY KEY",
        "user_id BIGINT (FK -> users.id, Indexed)",
        "user_email VARCHAR(255) NOT NULL (Indexed)",
        "user_role VARCHAR(50), auth_method VARCHAR(50) NOT NULL",
        "login_timestamp TIMESTAMP NOT NULL (Indexed with result)",
        "ip_address VARCHAR(45) NOT NULL (Indexed), ip_version VARCHAR(10)",
        "country VARCHAR(100), state_region VARCHAR(100), city VARCHAR(100)",
        "location_status VARCHAR(50) NOT NULL (LOCAL_DEV, RESOLVED, UNAVAILABLE)",
        "browser VARCHAR(100), operating_system VARCHAR(100), device_type VARCHAR(50)",
        "login_result VARCHAR(20) NOT NULL (SUCCESS, FAILED)",
        "failure_reason VARCHAR(100) (INVALID_CREDENTIALS, ROLE_MISMATCH, etc.)"
    ], badge="ENTITY 2 (V22)", badge_col="#f59e0b", highlight=True)

    content += card(1080, 120, 470, 240, "addresses (Customer Shipping Locations)", [
        "id BIGSERIAL PRIMARY KEY",
        "user_id BIGINT NOT NULL (FK -> users.id, Indexed)",
        "full_name VARCHAR(255) NOT NULL",
        "phone VARCHAR(50) NOT NULL",
        "address_line1 VARCHAR(255) NOT NULL",
        "address_line2 VARCHAR(255)",
        "city VARCHAR(100) NOT NULL",
        "state VARCHAR(100) NOT NULL",
        "postal_code VARCHAR(20) NOT NULL",
        "country VARCHAR(100) DEFAULT 'India' NOT NULL",
        "is_default BOOLEAN DEFAULT FALSE NOT NULL"
    ], badge="ENTITY 3", badge_col="#38bdf8")

    # ROW 2: CATEGORIES, PRODUCTS, REVIEWS
    content += card(50, 390, 450, 240, "categories (Product Taxonomy)", [
        "id BIGSERIAL PRIMARY KEY",
        "name VARCHAR(100) NOT NULL UNIQUE (Indexed)",
        "slug VARCHAR(100) NOT NULL UNIQUE",
        "description TEXT",
        "image_url VARCHAR(500)",
        "created_at TIMESTAMP NOT NULL",
        "5 Standard Categories: Electronics, Fashion,",
        "Home & Living, Beauty & Personal Care, Sports & Fitness",
        "Supports hierarchical marketplace filtering and SEO routing"
    ], badge="ENTITY 4", badge_col="#38bdf8")

    content += card(530, 390, 520, 240, "products (Multi-Vendor Marketplace Items)", [
        "id BIGSERIAL PRIMARY KEY",
        "seller_id BIGINT NOT NULL (FK -> users.id, Indexed)",
        "category_id BIGINT NOT NULL (FK -> categories.id, Indexed)",
        "name VARCHAR(255) NOT NULL (Full-text Indexed)",
        "slug VARCHAR(255) NOT NULL UNIQUE",
        "description TEXT, specifications JSONB / TEXT",
        "price NUMERIC(12,2) NOT NULL (Indian Rupees INR)",
        "discount_price NUMERIC(12,2)",
        "stock_quantity INT DEFAULT 0 NOT NULL",
        "image_url VARCHAR(500) NOT NULL, status VARCHAR(50)",
        "rating NUMERIC(3,2) DEFAULT 0.0, review_count INT DEFAULT 0"
    ], badge="ENTITY 5", badge_col="#04DB7E", highlight=True)

    content += card(1080, 390, 470, 240, "reviews (Verified Buyer Feedback)", [
        "id BIGSERIAL PRIMARY KEY",
        "product_id BIGINT NOT NULL (FK -> products.id, Indexed)",
        "customer_id BIGINT NOT NULL (FK -> users.id, Indexed)",
        "rating INT NOT NULL (CHECK rating BETWEEN 1 AND 5)",
        "title VARCHAR(255), comment TEXT",
        "verified_purchase BOOLEAN DEFAULT TRUE NOT NULL",
        "status VARCHAR(50) DEFAULT 'APPROVED' NOT NULL",
        "created_at TIMESTAMP NOT NULL",
        "Unique constraint: (product_id, customer_id) prevents duplicates"
    ], badge="ENTITY 6", badge_col="#a855f7")

    # ROW 3: ORDERS, ORDER ITEMS, PAYMENTS, TELEMETRY
    content += card(50, 660, 450, 280, "orders (Customer Purchase Headers)", [
        "id BIGSERIAL PRIMARY KEY",
        "customer_id BIGINT NOT NULL (FK -> users.id, Indexed)",
        "order_number VARCHAR(100) UNIQUE NOT NULL (Indexed)",
        "total_amount NUMERIC(12,2) NOT NULL (INR)",
        "discount_amount NUMERIC(12,2) DEFAULT 0.0",
        "final_amount NUMERIC(12,2) NOT NULL",
        "status VARCHAR(50) NOT NULL (PENDING, PAID, SHIPPED, DELIVERED)",
        "shipping_address JSONB / TEXT NOT NULL",
        "created_at TIMESTAMP NOT NULL",
        "updated_at TIMESTAMP NOT NULL"
    ], badge="ENTITY 7", badge_col="#04DB7E")

    content += card(530, 660, 340, 280, "order_items (Line Items)", [
        "id BIGSERIAL PRIMARY KEY",
        "order_id BIGINT NOT NULL (FK -> orders.id)",
        "product_id BIGINT NOT NULL (FK -> products.id)",
        "seller_id BIGINT NOT NULL (FK -> users.id)",
        "quantity INT NOT NULL",
        "unit_price NUMERIC(12,2) NOT NULL",
        "total_price NUMERIC(12,2) NOT NULL",
        "Enables multi-vendor partitioning",
        "Sellers see only their assigned items"
    ], badge="ENTITY 8", badge_col="#38bdf8")

    content += card(890, 660, 330, 280, "payments (Razorpay Gateway)", [
        "id BIGSERIAL PRIMARY KEY",
        "order_id BIGINT NOT NULL (FK -> orders.id)",
        "customer_id BIGINT NOT NULL (FK -> users.id)",
        "razorpay_order_id VARCHAR(100) (Indexed)",
        "razorpay_payment_id VARCHAR(100) (Indexed)",
        "razorpay_signature VARCHAR(255)",
        "amount NUMERIC(12,2) NOT NULL (INR)",
        "status VARCHAR(50) NOT NULL (PAID, FAILED)",
        "created_at TIMESTAMP NOT NULL"
    ], badge="ENTITY 9", badge_col="#10b981")

    content += card(1240, 660, 310, 280, "user_events (Telemetry)", [
        "id BIGSERIAL PRIMARY KEY",
        "user_id BIGINT (FK -> users.id)",
        "event_type VARCHAR(100) NOT NULL",
        "target_type VARCHAR(100)",
        "target_id VARCHAR(255)",
        "session_id VARCHAR(255)",
        "ip_address VARCHAR(45)",
        "event_timestamp TIMESTAMP NOT NULL",
        "event_data JSONB / TEXT",
        "Foundational ML training stream"
    ], badge="ENTITY 10", badge_col="#f59e0b")

    # Connectors
    content += conn(500, 220, 530, 220, "1 : N", col="#04DB7E")
    content += conn(275, 360, 275, 390, "Taxonomy", col="#38bdf8")
    content += conn(500, 500, 530, 500, "1 : N", col="#04DB7E")
    content += conn(1050, 500, 1080, 500, "1 : N", col="#a855f7")

    content += conn(275, 630, 275, 660, "1 : N", col="#04DB7E")
    content += conn(500, 770, 530, 770, "1 : N", col="#38bdf8")
    content += conn(870, 770, 890, 770, "1 : 1", col="#10b981")

    svg_data = wrap_svg(w, h, title, subtitle, content)
    with open(os.path.join(OUT_DIR, "09-database-architecture.svg"), "w", encoding="utf-8") as f:
        f.write(svg_data)

    cells = """
        <mxCell id="e1" value="Table: users (Account Entity, login_count, last_login_ip)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="120" width="450" height="240" as="geometry"/></mxCell>
        <mxCell id="e2" value="Table: user_login_events (Audit Entity, ip, location, device, result)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f59e0b;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="530" y="120" width="520" height="240" as="geometry"/></mxCell>
        <mxCell id="e3" value="Table: addresses (Shipping Locations)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1080" y="120" width="470" height="240" as="geometry"/></mxCell>
        <mxCell id="e4" value="Table: categories (Taxonomy)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="390" width="450" height="240" as="geometry"/></mxCell>
        <mxCell id="e5" value="Table: products (Multi-Vendor Items, Specs, Pricing)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="530" y="390" width="520" height="240" as="geometry"/></mxCell>
        <mxCell id="e6" value="Table: reviews (Verified Buyer Ratings &amp; Comments)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#a855f7;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1080" y="390" width="470" height="240" as="geometry"/></mxCell>
        <mxCell id="e7" value="Table: orders (Purchase Headers, Status Transitions)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="660" width="450" height="280" as="geometry"/></mxCell>
        <mxCell id="e8" value="Table: order_items (Multi-Vendor Partitioning)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="530" y="660" width="340" height="280" as="geometry"/></mxCell>
        <mxCell id="e9" value="Table: payments (Razorpay IDs, Status, Signatures)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#10b981;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="890" y="660" width="330" height="280" as="geometry"/></mxCell>
        <mxCell id="e10" value="Table: user_events (Telemetry Store for AI)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f59e0b;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1240" y="660" width="310" height="280" as="geometry"/></mxCell>
    """
    with open(os.path.join(OUT_DIR, "09-database-architecture.drawio"), "w", encoding="utf-8") as f:
        f.write(make_drawio(title, cells))

    print("Generated Diagram 9: Database Architecture")

if __name__ == "__main__":
    gen_diagram_7()
    gen_diagram_8()
    gen_diagram_9()

