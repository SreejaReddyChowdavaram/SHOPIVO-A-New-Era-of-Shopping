import os
import html
from generate_full_suite import wrap_svg, card, conn, make_drawio, OUT_DIR

# ==============================================================================
# DIAGRAM 4: ADMIN WORKFLOW
# ==============================================================================
def gen_diagram_4():
    w, h = 1600, 960
    title = "Administrator Platform Governance & Security Operations"
    subtitle = "Admin console workflows: executive analytics, user & seller verification, catalog moderation, financial audits, and security telemetry"

    content = """
    <!-- 5 CORE PILLARS OF ADMIN GOVERNANCE -->
    """
    content += card(50, 130, 275, 230, "1. Executive Oversight", [
        "Executive Dashboard /admin/dashboard",
        "Gross Platform Merchandise Value",
        "Active Customer & Seller Count",
        "Order Volume & Fulfillment Health",
        "Real-time System Status Monitoring",
        "Database Health & Migration State"
    ], badge="PILLAR 1", badge_col="#38bdf8")

    content += card(355, 130, 275, 230, "2. User & Access Control", [
        "Directory: /admin/users, /sellers",
        "Seller Verification & Approval Queue",
        "Inspect Store Documentation",
        "One-click Suspend / Activate Account",
        "Role Assignment & Security Limits",
        "Zero Google OAuth for Admin Role"
    ], badge="PILLAR 2", badge_col="#f43f5e", highlight=True)

    content += card(660, 130, 275, 230, "3. Catalog & Products", [
        "Cross-vendor Product Moderation",
        "Prohibited Item Quarantine / Hide",
        "Category Management (5 Categories)",
        "Price & Image Sanity Inspection",
        "Customer Review Moderation",
        "Inventory Stock Level Supervision"
    ], badge="PILLAR 3", badge_col="#04DB7E")

    content += card(965, 130, 275, 230, "4. Financial & Orders", [
        "Order Inspection: /admin/orders",
        "Payment Transactions & Webhook Logs",
        "Razorpay Payment Reconciliation",
        "Refund Approval & Dispute Handling",
        "Marketplace Fee & Commission Auditing",
        "Exportable Financial CSV Reports"
    ], badge="PILLAR 4", badge_col="#a855f7")

    content += card(1270, 130, 280, 230, "5. Security & Telemetry", [
        "Audit Trail: /admin/login-history",
        "Multi-attribute Filtering (Role, Status)",
        "Render Proxy IP & Location Tracking",
        "Failed Attempt & Brute-force Audit",
        "Data Retention Cleanup (90-365 Days)",
        "Raw Semester 2 ML Dataset Export"
    ], badge="PILLAR 5", badge_col="#f59e0b", highlight=True)

    # Connectors
    content += conn(325, 245, 355, 245, "Enforce", col="#f43f5e")
    content += conn(630, 245, 660, 245, "Moderate", col="#04DB7E")
    content += conn(935, 245, 965, 245, "Audit", col="#a855f7")
    content += conn(1240, 245, 1270, 245, "Telemetry", col="#f59e0b")

    # Bottom Panels
    content += """
    <rect x="50" y="390" width="1500" height="510" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="70" y="420" fill="#f43f5e" font-size="12" font-weight="700" letter-spacing="1">ADMINISTRATIVE SECURITY, VERIFICATION &amp; TELEMETRY ARCHITECTURE</text>
    """

    content += card(70, 440, 440, 210, "Seller Verification Pipeline", [
        "When app.seller.require-approval=true, new merchants default to enabled=false",
        "Admin reviews merchant store name, tax ID, and contact credentials",
        "Admin executes PATCH /api/admin/sellers/{id}/activate to approve store",
        "If fraudulent or non-compliant, Admin executes PATCH /api/admin/sellers/{id}/suspend",
        "Suspension instantly revokes JWT access across all seller portal endpoints",
        "All seller status modifications emit persistent administrative audit events"
    ], badge="MERCHANT GOVERNANCE", badge_col="#f43f5e")

    content += card(540, 440, 440, 210, "Login Telemetry & Audit Dashboard", [
        "Dedicated admin view at /admin/login-history backed by /api/admin/login-events",
        "Summary KPIs: Total Success Logins, Total Failed Logins, Platform Success Rate",
        "Server-side pagination and multi-attribute Spring Data JPA Specification filtering",
        "Filter by Role (Customer, Seller, Admin), Result (Success, Failed), Auth Method",
        "Real-time search across user email, IP address, and geographical city",
        "Displays device type, browser, operating system, and failure reasons"
    ], badge="LOGIN AUDIT", badge_col="#f59e0b", highlight=True)

    content += card(1010, 440, 520, 210, "Data Retention & Storage Hygiene", [
        "Configurable retention purge via POST /api/admin/login-events/cleanup",
        "Admin selects retention window: 90 days, 180 days, 365 days (default), or 730 days",
        "Executes high-performance indexed DELETE FROM user_login_events WHERE login_timestamp < :cutoff",
        "Protects user account metrics: users.login_count is preserved indefinitely",
        "Complies with privacy regulations (GDPR / Indian DPDP Act) for audit log lifecycles",
        "Returns audit confirmation with exact count of purged historical records"
    ], badge="DATA RETENTION", badge_col="#10b981")

    content += card(70, 670, 440, 200, "Catalog Oversight & Prohibited Goods", [
        "Admin can inspect any product across all 5 vendor storefronts",
        "Direct toggle to quarantine, delist, or update product status",
        "Validates compliance with marketplace policies and Indian pricing norms",
        "Reviews category hierarchy: Electronics, Fashion, Home, Beauty, Sports",
        "Maintains image storage hygiene in backend/data/uploads/",
        "Prevents orphaned products when merchant accounts are suspended"
    ], badge="CATALOG GOVERNANCE", badge_col="#04DB7E")

    content += card(540, 670, 440, 200, "Payment & Financial Supervision", [
        "Monitors all Razorpay payment transactions with order linkage",
        "Flags payment anomalies: amount mismatches, currency errors, failed webhooks",
        "Reconciles captured payments against database order records",
        "Admin can review customer return requests and approve financial refunds",
        "Refund execution triggers Razorpay Refund API and records refund transaction",
        "Exportable transaction journals for college faculty verification"
    ], badge="FINANCIAL AUDIT", badge_col="#a855f7")

    content += card(1010, 670, 520, 200, "Semester 2 AI Research Dataset Hub", [
        "AdminEventController provides research access to persistent telemetry logs",
        "GET /api/admin/events: Inspect user_events stream (Cart, Checkout, Browsing)",
        "GET /api/admin/events/export: Stream full CSV datasets for offline analysis",
        "Combines login activity, order patterns, and return telemetry",
        "Forms the foundational training corpus for Semester 2 Fraud Detection ML models",
        "Protected by strict Spring Security: hasRole('ADMIN') authorization required"
    ], badge="AI RESEARCH HUB", badge_col="#38bdf8")

    svg_data = wrap_svg(w, h, title, subtitle, content)
    with open(os.path.join(OUT_DIR, "04-admin-workflow.svg"), "w", encoding="utf-8") as f:
        f.write(svg_data)

    cells = """
        <mxCell id="a1" value="Pillar 1: Executive Oversight" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="130" width="275" height="230" as="geometry"/></mxCell>
        <mxCell id="a2" value="Pillar 2: User &amp; Access Control" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f43f5e;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="355" y="130" width="275" height="230" as="geometry"/></mxCell>
        <mxCell id="a3" value="Pillar 3: Catalog &amp; Products" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="660" y="130" width="275" height="230" as="geometry"/></mxCell>
        <mxCell id="a4" value="Pillar 4: Financial &amp; Orders" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#a855f7;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="965" y="130" width="275" height="230" as="geometry"/></mxCell>
        <mxCell id="a5" value="Pillar 5: Security &amp; Telemetry" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f59e0b;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1270" y="130" width="280" height="230" as="geometry"/></mxCell>
    """
    with open(os.path.join(OUT_DIR, "04-admin-workflow.drawio"), "w", encoding="utf-8") as f:
        f.write(make_drawio(title, cells))

    print("Generated Diagram 4: Admin Workflow")

# ==============================================================================
# DIAGRAM 5: AUTHENTICATION ARCHITECTURE
# ==============================================================================
def gen_diagram_5():
    w, h = 1600, 960
    title = "Tri-Portal Role-Based Authentication & Session Architecture"
    subtitle = "Zero-trust identity architecture: portal selection, RateLimitingFilter, BCrypt password auth, Google OIDC token verification, and strict role separation"

    content = """
    <!-- 3 PORTAL ENTRYPOINTS -->
    """
    content += card(50, 130, 260, 180, "Customer Portal", [
        "Route: /auth/customer",
        "Role: ROLE_CUSTOMER",
        "Email / Password Sign-In",
        "Google Sign-In Enabled",
        "Self-registration Permitted",
        "Redirect: /customer/dashboard"
    ], badge="PORTAL 1", badge_col="#38bdf8")

    content += card(340, 130, 260, 180, "Seller Portal", [
        "Route: /auth/seller",
        "Role: ROLE_SELLER",
        "Email / Password Sign-In",
        "Google Sign-In Enabled",
        "Store Details Captured",
        "Redirect: /seller/dashboard"
    ], badge="PORTAL 2", badge_col="#04DB7E")

    content += card(630, 130, 260, 180, "Administrator Portal", [
        "Route: /auth/admin",
        "Role: ROLE_ADMIN",
        "Authorized Credentials Only",
        "Google OAuth STRICTLY FORBIDDEN",
        "Self-registration Forbidden",
        "Redirect: /admin/dashboard"
    ], badge="PORTAL 3", badge_col="#f43f5e", highlight=True)

    content += card(940, 130, 610, 180, "Security Ingress Gateway & Rate Limiting Filter", [
        "RateLimitingFilter: Intercepts all requests matching /api/auth/**",
        "Strict Rate Limit: Maximum 5 authentication requests per minute per IP address",
        "Blocks brute-force dictionary attacks, automated bot stuffing, and credential spraying",
        "Exceeded threshold triggers instantaneous HTTP 429 TOO_MANY_REQUESTS",
        "Preserves server compute resources and prevents database connection pool exhaustion",
        "Emits security alert telemetry on anomalous request velocity spikes"
    ], badge="FIREWALL FILTER", badge_col="#f59e0b", highlight=True)

    # Middle Row: Dual Auth Engines & Strict Role Boundary
    content += card(50, 360, 450, 240, "Engine A: Password Authentication", [
        "AuthController: POST /api/auth/login",
        "Email lookup in PostgreSQL (Case-insensitive)",
        "BCryptPasswordEncoder: 10 rounds adaptive salted hashing",
        "Enabled status check: Disabled accounts rejected with HTTP 401",
        "Role Boundary Check: Matches user.role against request.portalRole",
        "If mismatch: Reject with HTTP 401 & explanatory portal redirect guidance",
        "Success: Emit LOGIN_SUCCESS, increment login_count, generate JWT",
        "Failure: Emit LOGIN_FAILURE with reason (INVALID_CREDENTIALS, ROLE_MISMATCH)"
    ], badge="AUTH ENGINE A", badge_col="#04DB7E")

    content += card(530, 360, 480, 240, "Engine B: Google OAuth 2.0 / OIDC Verification", [
        "GoogleAuthController: POST /api/auth/google",
        "Official GoogleIdTokenVerifier: Cryptographic RSA signature check",
        "Audience check: Validates token was issued for SHOPIVO GOOGLE_CLIENT_ID",
        "Email verification: Rejects accounts where email_verified != true",
        "Strict Admin Protection: Google CANNOT create or access ADMIN accounts (403)",
        "Account Deduplication: Retrieves existing account without creating duplicate",
        "Cross-role rejection: Customer cannot access Seller portal via Google (409)",
        "Success: Emit LOGIN_SUCCESS, update login telemetry, issue SHOPIVO JWT"
    ], badge="AUTH ENGINE B", badge_col="#38bdf8")

    content += card(1040, 360, 510, 240, "Role Boundary Gatekeeper & Access Matrix", [
        "CUSTOMER -> Customer Portal: ALLOWED (Access to catalog, orders, cart)",
        "CUSTOMER -> Seller Portal: REJECTED (HTTP 409 / 401: Registered as Customer)",
        "CUSTOMER -> Admin Portal: REJECTED (HTTP 401/403: Administrator privileges required)",
        "SELLER -> Seller Portal: ALLOWED (Access to products, inventory, revenue)",
        "SELLER -> Admin Portal: REJECTED (HTTP 401/403: Administrator privileges required)",
        "ADMIN -> Admin Portal: ALLOWED (Password auth only; authorized credentials)",
        "ADMIN -> Google OAuth: STRICTLY REJECTED (HTTP 403 Forbidden)",
        "Prevents privilege escalation and cross-role session hijacking"
    ], badge="ROLE GATEKEEPER", badge_col="#f43f5e", highlight=True)

    # Bottom Row: JWT Engine & Security Context
    content += card(50, 640, 450, 270, "JWT Engine & Claims Structure", [
        "Algorithm: HMAC-SHA256 (HS256) signed with 256-bit secret key",
        "Standard Claims: sub (User ID), iss (Shopivo), iat (Issued At), exp (24 hours)",
        "Custom Claims: role (CUSTOMER, SELLER, ADMIN)",
        "Stateless: No server-side session state stored in memory or DB",
        "Transmitted in HTTP Authorization Header: Bearer <token>",
        "Stored securely in client localStorage with automatic redux synchronization",
        "Logout: Flushes client token and records LOGOUT telemetry event"
    ], badge="SESSION ENGINE", badge_col="#a855f7")

    content += card(530, 640, 480, 270, "Spring Security Context & Filter Chain", [
        "JwtAuthFilter intercepts every incoming HTTP request",
        "Extracts Bearer token from Authorization header",
        "JwtUtil validates cryptographic signature and expiration window",
        "Loads User entity from UserRepository and sets UsernamePasswordAuthenticationToken",
        "Populates SecurityContextHolder.getContext().setAuthentication(auth)",
        "Enables @PreAuthorize(\"hasRole('ADMIN')\") on controller endpoints",
        "Provides @AuthenticationPrincipal User currentUser in controller methods"
    ], badge="FILTER CHAIN", badge_col="#04DB7E")

    content += card(1040, 640, 510, 270, "Authentication Telemetry Hook", [
        "Integrated directly into AuthService and GoogleAuthService",
        "On Success: Calls loginActivityService.recordLoginSuccess(user, method)",
        "  -> Increments users.login_count by 1",
        "  -> Resolves Render proxy client IP and approximate city/country",
        "  -> Saves UserLoginEvent with status SUCCESS and client user-agent",
        "On Failure: Calls loginActivityService.recordLoginFailure(email, role, method, reason)",
        "  -> Preserves login_count (never incremented on failed attempts)",
        "  -> Records failure reason (USER_NOT_FOUND, INVALID_CREDENTIALS, ROLE_MISMATCH)"
    ], badge="TELEMETRY HOOK", badge_col="#f59e0b", highlight=True)

    # Connectors
    content += conn(180, 310, 275, 360, "Password Auth", col="#04DB7E")
    content += conn(470, 310, 770, 360, "Google Token", col="#38bdf8")
    content += conn(760, 310, 1290, 360, "Admin Credentials", col="#f43f5e")

    content += conn(275, 600, 275, 640, "Issue JWT", col="#a855f7")
    content += conn(770, 600, 770, 640, "Validate JWT", col="#04DB7E")
    content += conn(1295, 600, 1295, 640, "Record Event", col="#f59e0b")

    svg_data = wrap_svg(w, h, title, subtitle, content)
    with open(os.path.join(OUT_DIR, "05-authentication-architecture.svg"), "w", encoding="utf-8") as f:
        f.write(svg_data)

    cells = """
        <mxCell id="p1" value="Customer Portal (/auth/customer)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="130" width="260" height="180" as="geometry"/></mxCell>
        <mxCell id="p2" value="Seller Portal (/auth/seller)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="340" y="130" width="260" height="180" as="geometry"/></mxCell>
        <mxCell id="p3" value="Admin Portal (/auth/admin)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f43f5e;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="630" y="130" width="260" height="180" as="geometry"/></mxCell>
        <mxCell id="p4" value="RateLimitingFilter (5 req/min)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f59e0b;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="940" y="130" width="610" height="180" as="geometry"/></mxCell>
        <mxCell id="p5" value="Engine A: BCrypt Password Authentication" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="360" width="450" height="240" as="geometry"/></mxCell>
        <mxCell id="p6" value="Engine B: Google OAuth 2.0 / OIDC Verification" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="530" y="360" width="480" height="240" as="geometry"/></mxCell>
        <mxCell id="p7" value="Role Boundary Gatekeeper &amp; Access Matrix" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f43f5e;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1040" y="360" width="510" height="240" as="geometry"/></mxCell>
    """
    with open(os.path.join(OUT_DIR, "05-authentication-architecture.drawio"), "w", encoding="utf-8") as f:
        f.write(make_drawio(title, cells))

    print("Generated Diagram 5: Authentication Architecture")

# ==============================================================================
# DIAGRAM 6: PASSWORD RESET WORKFLOW
# ==============================================================================
def gen_diagram_6():
    w, h = 1600, 960
    title = "Secure 6-Digit OTP Password Reset Architecture (Brevo SMTP)"
    subtitle = "Enterprise password recovery: cryptographic OTP generation, Brevo SMTP relay, dark CyberForge branded HTML email, and single-use reset token"

    content = """
    <!-- 4 STEP HORIZONTAL WORKFLOW -->
    """
    content += card(50, 130, 340, 220, "Step 1: Request OTP", [
        "User visits /forgot-password",
        "Submits email + portal role",
        "Rate limiting: 3 OTP requests / 15 min",
        "SecureRandom generates 6-digit OTP",
        "Stores OTP hash + 10-minute expiry in memory",
        "Prevents user enumeration by uniform response"
    ], badge="STEP 1", badge_col="#38bdf8")

    content += card(440, 130, 340, 220, "Step 2: Brevo SMTP Delivery", [
        "Spring JavaMailSender with STARTTLS",
        "Relay: smtp-relay.brevo.com:587",
        "Sender: shopivo.team@gmail.com",
        "Subject: SHOPIVO - Verification Code",
        "Dark CyberForge HTML email template",
        "Prominent emerald OTP box + 10m countdown"
    ], badge="STEP 2", badge_col="#04DB7E", highlight=True)

    content += card(830, 130, 340, 220, "Step 3: OTP Verification", [
        "User inputs 6-digit verification code",
        "Validates code against active memory store",
        "Checks expiration (10 minute window)",
        "Max 5 failed attempts before OTP invalidation",
        "Generates single-use cryptographic Reset Token",
        "Returns Reset Token to frontend in response"
    ], badge="STEP 3", badge_col="#04DB7E")

    content += card(1220, 130, 330, 220, "Step 4: Password Update", [
        "User inputs new password + confirmation",
        "Validates Reset Token + password complexity",
        "BCryptPasswordEncoder hashes new password",
        "Updates user.password_hash in PostgreSQL",
        "Revokes Reset Token immediately (single-use)",
        "Emits PASSWORD_RESET security audit event"
    ], badge="STEP 4", badge_col="#f59e0b")

    # Connectors
    content += conn(390, 240, 440, 240, "Send Mail", col="#04DB7E")
    content += conn(780, 240, 830, 240, "Enter OTP", col="#04DB7E")
    content += conn(1170, 240, 1220, 240, "Reset Token", col="#f59e0b")

    # Bottom Panels
    content += """
    <rect x="50" y="380" width="1500" height="520" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="70" y="410" fill="#04DB7E" font-size="12" font-weight="700" letter-spacing="1">PASSWORD RESET SECURITY SPECIFICATION &amp; BREVO SMTP INTEGRATION</text>
    """

    content += card(70, 430, 440, 210, "Brevo SMTP Infrastructure Configuration", [
        "MAIL_HOST: smtp-relay.brevo.com (Port 587)",
        "MAIL_USERNAME: c27139001@smtp-brevo.com",
        "MAIL_FROM: shopivo.team@gmail.com (Verified Brevo Sender)",
        "MAIL_PASSWORD: Encrypted Brevo SMTP relay key",
        "Spring Boot JavaMailSender configured via application.yml",
        "Credentials stored exclusively in environment variables (Never committed to Git)"
    ], badge="SMTP CONFIG", badge_col="#04DB7E")

    content += card(540, 430, 440, 210, "CyberForge Transactional Email Template", [
        "EmailTemplateService generates high-fidelity corporate HTML email",
        "Header: SHOPIVO brand logo + tagline 'A New Era of Shopping'",
        "Content Card: Large 28px letter-spaced OTP in emerald (#04DB7E) box",
        "Security Notice: Advises user that SHOPIVO will never ask for OTP",
        "Expiry Notice: Explicit 10-minute validity countdown indicator",
        "Footer: Official support contact (shopivo.team@gmail.com) + branding"
    ], badge="EMAIL TEMPLATE", badge_col="#38bdf8")

    content += card(1010, 430, 520, 210, "Timing Attack & Enumeration Defenses", [
        "Uniform HTTP response returned even if email address does not exist in database",
        "Dummy cryptographic hashing executed on non-existent accounts to eliminate timing deltas",
        "Strict portal role validation prevents cross-role password resets (e.g. Customer resetting Admin)",
        "Zero plain-text OTPs stored in database or printed in server application logs",
        "Reset Tokens expire after 10 minutes or immediately upon first successful use",
        "Attempts to reuse a burned Reset Token return HTTP 400 BAD_REQUEST"
    ], badge="SECURITY CONTROLS", badge_col="#f59e0b", highlight=True)

    content += card(70, 660, 440, 210, "Frontend Step-by-Step Experience", [
        "Single dedicated, state-driven view at /forgot-password",
        "Step indicator tracks user progress (1. Email -> 2. OTP -> 3. Password -> 4. Success)",
        "Automatic auto-focus on 6-digit OTP input boxes with digit advance",
        "Interactive countdown timer displays minutes and seconds remaining",
        "Resend OTP button enabled only after 60-second cooldown period",
        "Direct one-click redirect to portal login upon successful password update"
    ], badge="UI WORKFLOW", badge_col="#38bdf8")

    content += card(540, 660, 440, 210, "Cryptographic Token Lifecycle", [
        "OTP Generation: java.security.SecureRandom generates uniformly distributed integers (100000 - 999999)",
        "In-Memory Cache: ConcurrentHashMap<String, ResetState> with expiry eviction",
        "Reset Token Generation: java.util.UUID cryptographically random token",
        "Token verification checks both token string equality and remaining lifetime",
        "Upon successful password update: ResetState is permanently removed from cache",
        "Garbage collection daemon purges expired states automatically"
    ], badge="TOKEN ENGINE", badge_col="#a855f7")

    content += card(1010, 660, 520, 210, "Audit Logging & Threat Telemetry", [
        "Every OTP request logs OTP_REQUESTED event with client IP and user-agent",
        "Failed OTP verification attempts trigger OTP_FAILED security audit log",
        "Exceeding 5 failed attempts locks OTP and raises BRUTE_FORCE_ALERT",
        "Successful reset records PASSWORD_RESET_COMPLETED with timestamp",
        "Emits notification email alerting user of password change confirmation",
        "Integrated with EventLoggingService for Semester 2 anomaly detection"
    ], badge="AUDIT TELEMETRY", badge_col="#10b981")

    svg_data = wrap_svg(w, h, title, subtitle, content)
    with open(os.path.join(OUT_DIR, "06-password-reset-workflow.svg"), "w", encoding="utf-8") as f:
        f.write(svg_data)

    cells = """
        <mxCell id="r1" value="Step 1: Request OTP (/forgot-password)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="130" width="340" height="220" as="geometry"/></mxCell>
        <mxCell id="r2" value="Step 2: Brevo SMTP Delivery (smtp-relay.brevo.com:587)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="440" y="130" width="340" height="220" as="geometry"/></mxCell>
        <mxCell id="r3" value="Step 3: OTP Verification (Max 5 Attempts)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="830" y="130" width="340" height="220" as="geometry"/></mxCell>
        <mxCell id="r4" value="Step 4: Password Update (BCrypt + Revoke Token)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f59e0b;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1220" y="130" width="330" height="220" as="geometry"/></mxCell>
    """
    with open(os.path.join(OUT_DIR, "06-password-reset-workflow.drawio"), "w", encoding="utf-8") as f:
        f.write(make_drawio(title, cells))

    print("Generated Diagram 6: Password Reset Workflow")

if __name__ == "__main__":
    gen_diagram_4()
    gen_diagram_5()
    gen_diagram_6()

