import os
import html
from generate_full_suite import wrap_svg, card, conn, make_drawio, OUT_DIR

# ==============================================================================
# DIAGRAM 1: OVERALL SYSTEM ARCHITECTURE
# ==============================================================================
def gen_diagram_1():
    w, h = 1600, 1040
    title = "Overall SHOPIVO System Architecture"
    subtitle = "End-to-end multi-tier micro-modular architecture: React 19 SPA, Render Reverse Proxy, Spring Boot 3.4.3 backend, and PostgreSQL database"

    content = """
    <!-- TIER 1: CLIENT TIER -->
    <rect x="35" y="115" width="1530" height="155" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="50" y="138" fill="#04DB7E" font-size="11" font-weight="700" letter-spacing="1">TIER 1: FRONTEND CLIENT LAYER (REACT 19 + VITE 8.2.1)</text>
    """
    content += card(50, 150, 340, 105, "Customer Marketplace SPA", [
        "Product Discovery, Search & Filters",
        "Cart, Wishlist & Razorpay Checkout",
        "Self-Service Login Activity & Orders"
    ], badge="CLIENT", badge_col="#38bdf8")

    content += card(420, 150, 340, 105, "Seller Portal Console", [
        "Store Onboarding & Product Catalog",
        "Inventory Control & Order Processing",
        "Revenue Analytics & Login Audits"
    ], badge="CLIENT", badge_col="#04DB7E")

    content += card(790, 150, 340, 105, "Administrator Console", [
        "Platform Governance & User Directory",
        "Seller Verification & Store Approval",
        "Login Telemetry Audit & Retention Purge"
    ], badge="CLIENT", badge_col="#f43f5e")

    content += card(1160, 150, 380, 105, "Shared Client Services", [
        "Redux Toolkit Global State & Auth Slice",
        "React Router v7 RoleRoute Guard",
        "Axios HTTP Client + JWT Interceptors"
    ], badge="SHARED", badge_col="#a855f7")

    content += """
    <!-- TIER 2: EDGE & PROXY -->
    <rect x="35" y="295" width="1530" height="95" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="50" y="318" fill="#38bdf8" font-size="11" font-weight="700" letter-spacing="1">TIER 2: EDGE INGRESS, REVERSE PROXY &amp; SECURITY FIREWALL (RENDER CLOUD)</text>
    """
    content += card(50, 330, 470, 50, "Render Cloud Edge Proxy", [
        "TLS 1.3 Termination, HTTPS Redirection, DDoS Protection"
    ], badge="EDGE", badge_col="#38bdf8")

    content += card(550, 330, 480, 50, "Proxy IP Forwarding Header", [
        "X-Forwarded-For: &lt;client-ip&gt;, &lt;proxy-1&gt;, &lt;proxy-2&gt; Forwarding"
    ], badge="PROXY", badge_col="#38bdf8")

    content += card(1060, 330, 480, 50, "Global Rate Limiting &amp; CORS", [
        "Origin Verification, Context-Path: /api, Pre-flight CORS Policy"
    ], badge="GATEWAY", badge_col="#38bdf8")

    content += """
    <!-- TIER 3: BACKEND APPLICATION TIER -->
    <rect x="35" y="415" width="1530" height="340" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="50" y="438" fill="#04DB7E" font-size="11" font-weight="700" letter-spacing="1">TIER 3: SECURECOMMERCE CORE APPLICATION BACKEND (SPRING BOOT 3.4.3 / JAVA 21)</text>
    """

    content += card(50, 455, 360, 130, "Security & Authentication", [
        "JwtAuthFilter: Bearer Token Validation",
        "RateLimitingFilter: 5 req/min Auth Protection",
        "@PreAuthorize Role-Based Method Security",
        "BCryptPasswordEncoder (Cost factor 10)"
    ], badge="SECURITY", badge_col="#04DB7E", highlight=True)

    content += card(440, 455, 350, 130, "Identity & Auth Services", [
        "AuthService: Password login & registration",
        "GoogleAuthService: Official OIDC verifier",
        "PasswordResetService: 6-digit OTP engine",
        "Strict Cross-Portal Access Enforcement"
    ], badge="SERVICE", badge_col="#04DB7E")

    content += card(820, 455, 360, 130, "Marketplace Core Services", [
        "ProductService: Catalog & Specification CRUD",
        "OrderService: Multi-item fulfillment & state",
        "PaymentService: Razorpay order & signature",
        "ReviewService: Verified buyer rating system"
    ], badge="SERVICE", badge_col="#04DB7E")

    content += card(1210, 455, 330, 130, "Telemetry & Analytics", [
        "EventLoggingService: Telemetry tracking",
        "EventContextResolver: Proxy unwrapping",
        "IpGeolocationService: Geo lookup & cache",
        "LoginActivityService: Audit trail engine"
    ], badge="RESEARCH", badge_col="#f59e0b", highlight=True)

    content += card(50, 605, 360, 130, "Authentication Controllers", [
        "AuthController: /api/auth/login, /register",
        "GoogleAuthController: /api/auth/google",
        "PasswordResetController: /forgot-password",
        "UserLoginEventController: /auth/login-history"
    ], badge="CONTROLLER", badge_col="#04DB7E")

    content += card(440, 605, 350, 130, "Commerce REST Controllers", [
        "ProductController: Public & Seller catalog",
        "OrderController: Customer order lifecycle",
        "PaymentController: Razorpay checkout & hook",
        "ReviewController: Ratings & reviews API"
    ], badge="CONTROLLER", badge_col="#04DB7E")

    content += card(820, 605, 360, 130, "Administration Controllers", [
        "AdminUserController: Suspend / activate accounts",
        "AdminSellerController: Verification review",
        "AdminEventController: Raw research dataset export",
        "AdminLoginEventController: /admin/login-events"
    ], badge="CONTROLLER", badge_col="#f43f5e")

    content += card(1210, 605, 330, 130, "Spring Data Repositories", [
        "UserRepository & UserLoginEventRepository",
        "ProductRepository & CategoryRepository",
        "OrderRepository & PaymentRepository",
        "UserEventRepository (Telemetry store)"
    ], badge="PERSISTENCE", badge_col="#04DB7E")

    content += """
    <!-- TIER 4: DATA & EXTERNAL INTEGRATIONS -->
    <rect x="35" y="780" width="1530" height="195" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="50" y="803" fill="#a855f7" font-size="11" font-weight="700" letter-spacing="1">TIER 4: RELATIONAL DATABASE &amp; THIRD-PARTY INTEGRATION ECOSYSTEM</text>
    """

    content += card(50, 820, 420, 140, "PostgreSQL Database (Render Cloud)", [
        "Flyway Database Migrations (V1__init through V22)",
        "users: login_count, last_login_ip, last_login_at",
        "user_login_events: Dedicated audit trail table",
        "HikariCP Connection Pool (Max: 10, Timeout: 30s)"
    ], badge="DATABASE", badge_col="#38bdf8", highlight=True)

    content += card(500, 820, 330, 140, "Brevo SMTP Relay", [
        "Host: smtp-relay.brevo.com:587",
        "JavaMailSender with STARTTLS",
        "Dynamic 6-digit OTP delivery",
        "CyberForge Branded HTML Templates"
    ], badge="EXTERNAL", badge_col="#10b981")

    content += card(860, 820, 330, 140, "Razorpay Payments", [
        "Standard Checkout Webhook (HMAC)",
        "Razorpay Orders & Payment verification",
        "Currency: INR (Indian Rupee)",
        "Automated Order Confirmation"
    ], badge="EXTERNAL", badge_col="#38bdf8")

    content += card(1220, 820, 320, 140, "Google Identity & Geo Services", [
        "Google Identity Services (OIDC)",
        "Cryptographic Token Verifier",
        "IP-API Geolocation Engine",
        "In-Memory Concurrent LRU Cache"
    ], badge="EXTERNAL", badge_col="#f59e0b")

    # Connectors
    content += conn(220, 255, 280, 330, "HTTPS / REST", col="#38bdf8")
    content += conn(590, 255, 600, 330, "HTTPS / REST", col="#04DB7E")
    content += conn(960, 255, 980, 330, "HTTPS / REST", col="#f43f5e")

    content += conn(285, 380, 230, 455, "Forwarded Request", col="#04DB7E")
    content += conn(790, 380, 615, 455, "Proxy Context", col="#04DB7E")
    content += conn(1300, 380, 1000, 455, "Rate Checked", col="#04DB7E")

    content += conn(230, 735, 230, 820, "JPA / SQL", col="#38bdf8")
    content += conn(615, 735, 665, 820, "SMTP / TLS", col="#10b981")
    content += conn(1000, 735, 1025, 820, "REST Webhooks", col="#38bdf8")
    content += conn(1375, 735, 1380, 820, "OIDC / HTTP", col="#f59e0b")

    svg_data = wrap_svg(w, h, title, subtitle, content)
    with open(os.path.join(OUT_DIR, "01-system-architecture.svg"), "w", encoding="utf-8") as f:
        f.write(svg_data)

    cells = """
        <mxCell id="c1" value="Customer Marketplace SPA (React 19)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="150" width="340" height="105" as="geometry"/></mxCell>
        <mxCell id="c2" value="Seller Portal Console (React 19)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="420" y="150" width="340" height="105" as="geometry"/></mxCell>
        <mxCell id="c3" value="Administrator Console (React 19)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f43f5e;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="790" y="150" width="340" height="105" as="geometry"/></mxCell>
        <mxCell id="c4" value="Render Cloud Edge &amp; Reverse Proxy" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#161616;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="320" width="1490" height="60" as="geometry"/></mxCell>
        <mxCell id="c5" value="Spring Boot 3.4.3 Core Backend (Security, REST, Domain Services)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="450" width="1490" height="280" as="geometry"/></mxCell>
        <mxCell id="c6" value="PostgreSQL Database (Flyway V1..V22, users, user_login_events)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="810" width="450" height="150" as="geometry"/></mxCell>
        <mxCell id="c7" value="Brevo SMTP Relay (smtp-relay.brevo.com:587)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#10b981;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="530" y="810" width="320" height="150" as="geometry"/></mxCell>
        <mxCell id="c8" value="Razorpay Payment Gateway (Checkout &amp; Webhooks)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="880" y="810" width="320" height="150" as="geometry"/></mxCell>
        <mxCell id="c9" value="Google Identity &amp; IP-API Geolocation Engine" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f59e0b;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1230" y="810" width="310" height="150" as="geometry"/></mxCell>
    """
    with open(os.path.join(OUT_DIR, "01-system-architecture.drawio"), "w", encoding="utf-8") as f:
        f.write(make_drawio(title, cells))

    print("Generated Diagram 1: System Architecture")

# ==============================================================================
# DIAGRAM 2: CUSTOMER WORKFLOW
# ==============================================================================
def gen_diagram_2():
    w, h = 1600, 960
    title = "Customer Marketplace Journey & Lifecycle Workflow"
    subtitle = "End-to-end customer experience: discovery, catalog search, cart validation, Razorpay checkout, order fulfillment, and account security"

    content = """
    <!-- 6 STAGES OF CUSTOMER WORKFLOW -->
    """
    # Stage 1
    content += card(50, 130, 230, 220, "1. Discovery & Search", [
        "Marketplace Landing Page",
        "Explore Categories",
        "Live Keyword Auto-complete",
        "Price & Rating Filter",
        "Inspect Specifications",
        "Customer Reviews & Badges"
    ], badge="STAGE 1", badge_col="#38bdf8")

    # Stage 2
    content += card(310, 130, 230, 220, "2. Cart & Decision", [
        "Add to Cart / Move to Wishlist",
        "Real-time Stock Validation",
        "Quantity Adjustments",
        "Cart Persistence in Local/DB",
        "Coupon Code Application",
        "Subtotal & Tax Calculation"
    ], badge="STAGE 2", badge_col="#38bdf8")

    # Stage 3
    content += card(570, 130, 230, 220, "3. Secure Checkout", [
        "Select / Add Shipping Address",
        "Review Order Line Items",
        "Total Breakdown in INR",
        "Generate Razorpay Order",
        "Launch Razorpay Modal",
        "Cards, UPI, Netbanking, Wallets"
    ], badge="STAGE 3", badge_col="#04DB7E", highlight=True)

    # Stage 4
    content += card(830, 130, 230, 220, "4. Payment & Order", [
        "Client Payment Submission",
        "Razorpay Webhook Triggered",
        "HMAC Signature Verification",
        "Order State: CREATED -> PAID",
        "Stock Count Auto-decrement",
        "Confirmation Email via Brevo"
    ], badge="STAGE 4", badge_col="#04DB7E", highlight=True)

    # Stage 5
    content += card(1090, 130, 230, 220, "5. Order Fulfillment", [
        "Real-time Tracking View",
        "Seller Packing & Dispatch",
        "Status: PROCESSING -> SHIPPED",
        "Out for Delivery & DELIVERED",
        "Download Invoice / Receipt",
        "Initiate Return / Refund"
    ], badge="STAGE 5", badge_col="#a855f7")

    # Stage 6
    content += card(1345, 130, 205, 220, "6. Account & Security", [
        "Spending Analytics Insights",
        "Post-purchase Product Review",
        "Star Ratings & Testimonials",
        "Login Activity Inspection",
        "IP & Geolocation Log View",
        "Self-service Password Change"
    ], badge="STAGE 6", badge_col="#f59e0b")

    # Connectors across top flow
    content += conn(280, 240, 310, 240, "Add to Cart", col="#38bdf8")
    content += conn(540, 240, 570, 240, "Proceed", col="#04DB7E")
    content += conn(800, 240, 830, 240, "Pay INR", col="#04DB7E")
    content += conn(1060, 240, 1090, 240, "Fulfilled", col="#a855f7")
    content += conn(1320, 240, 1345, 240, "Review", col="#f59e0b")

    # Bottom Architecture Detail Panels
    content += """
    <rect x="50" y="380" width="1500" height="520" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="70" y="410" fill="#04DB7E" font-size="12" font-weight="700" letter-spacing="1">DEEP ARCHITECTURAL DIVE: CUSTOMER SECURITY &amp; PAYMENT LIFECYCLE</text>
    """

    content += card(70, 430, 440, 210, "Checkout & Payment Flow Detail", [
        "Frontend calls POST /api/payments/create-order with orderId",
        "Backend creates order via Razorpay SDK with INR amount in paise",
        "Checkout modal opens securely in iframe; card/UPI credentials never touch SHOPIVO servers",
        "Razorpay returns razorpay_payment_id, order_id, signature",
        "Backend verifies HMAC-SHA256 signature using RAZORPAY_KEY_SECRET",
        "Database transaction: Updates Payment & Order status to PAID atomically"
    ], badge="PAYMENT GATEWAY", badge_col="#04DB7E")

    content += card(540, 430, 440, 210, "Order Lifecycle & Stock Sync", [
        "Optimistic locking prevents overselling during flash-sale spikes",
        "Hibernate updates product.stock_quantity = stock_quantity - quantity",
        "Seller receives live order notification with shipping address",
        "Customer tracks live status updates: PENDING -> PROCESSING -> SHIPPED -> DELIVERED",
        "Customer can request replacement or return within eligible return window",
        "Refund processed via Razorpay API and logged to refund audit table"
    ], badge="ORDER ENGINE", badge_col="#38bdf8")

    content += card(1010, 430, 520, 210, "Customer Security & Privacy Telemetry", [
        "Every successful sign-in increments users.login_count and records IP / location",
        "Customer accesses personal security dashboard at /customer/login-activity",
        "Transparent notice informs customer: approximate IP geolocation only, zero GPS tracking",
        "Login history reveals browser, operating system, device type, and login timestamp",
        "Failed login attempts are audited separately with failure codes",
        "Strict authorization: Customers can ONLY query their own login history (HTTP 401/403 enforced)"
    ], badge="SECURITY TELEMETRY", badge_col="#f59e0b", highlight=True)

    content += card(70, 660, 440, 210, "Product Discovery & Filter Engine", [
        "Public category navigation (Electronics, Fashion, Home, Beauty, Sports)",
        "Case-insensitive PostgreSQL full-text search with LIKE/ILIKE indexing",
        "Multi-vendor separation: Products display seller store name and verified badge",
        "Dynamic ratings: Aggregated average stars calculated from verified purchase reviews",
        "Responsive grid layout adapts from 4 columns desktop to 2 columns mobile",
        "Infinite scroll / paginated catalog with low network payload footprint"
    ], badge="CATALOG ENGINE", badge_col="#38bdf8")

    content += card(540, 660, 440, 210, "Review & Social Proof System", [
        "Only customers with confirmed DELIVERED order status can submit reviews",
        "Star rating (1 to 5 stars) + headline + detailed user feedback",
        "Prevents competitor review manipulation and fraudulent feedback spam",
        "Moderation pipeline: Admin can flag, hide, or inspect reported reviews",
        "Reviews immediately update aggregate product rating and review count",
        "Customer can edit or update their existing review anytime"
    ], badge="REVIEW SYSTEM", badge_col="#a855f7")

    content += card(1010, 660, 520, 210, "Post-Purchase Support & Invoicing", [
        "Downloadable GST-compliant order summary and itemized receipts",
        "Automated transactional email receipts delivered through Brevo SMTP",
        "Returns workflow: Customer uploads return reason + condition details",
        "Seller inspects returned merchandise and confirms acceptance",
        "Refund triggered automatically to original Razorpay payment source",
        "All return and refund status transitions emit persistent audit telemetry"
    ], badge="RETURNS & REFUNDS", badge_col="#10b981")

    svg_data = wrap_svg(w, h, title, subtitle, content)
    with open(os.path.join(OUT_DIR, "02-customer-workflow.svg"), "w", encoding="utf-8") as f:
        f.write(svg_data)

    cells = """
        <mxCell id="w1" value="Stage 1: Discovery &amp; Search" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="130" width="230" height="220" as="geometry"/></mxCell>
        <mxCell id="w2" value="Stage 2: Cart &amp; Decision" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="310" y="130" width="230" height="220" as="geometry"/></mxCell>
        <mxCell id="w3" value="Stage 3: Secure Checkout" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="570" y="130" width="230" height="220" as="geometry"/></mxCell>
        <mxCell id="w4" value="Stage 4: Payment &amp; Order" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="830" y="130" width="230" height="220" as="geometry"/></mxCell>
        <mxCell id="w5" value="Stage 5: Order Fulfillment" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#a855f7;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1090" y="130" width="230" height="220" as="geometry"/></mxCell>
        <mxCell id="w6" value="Stage 6: Account &amp; Security" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f59e0b;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1345" y="130" width="205" height="220" as="geometry"/></mxCell>
    """
    with open(os.path.join(OUT_DIR, "02-customer-workflow.drawio"), "w", encoding="utf-8") as f:
        f.write(make_drawio(title, cells))

    print("Generated Diagram 2: Customer Workflow")

# ==============================================================================
# DIAGRAM 3: SELLER WORKFLOW
# ==============================================================================
def gen_diagram_3():
    w, h = 1600, 960
    title = "Multi-Vendor Seller Operations & Lifecycle Architecture"
    subtitle = "Merchant journey: registration & verification, catalog management, inventory tracking, order fulfillment, and financial analytics"

    content = """
    <!-- 5 PHASES OF SELLER LIFECYCLE -->
    """
    content += card(50, 130, 275, 230, "1. Registration & Onboarding", [
        "Sign up at /auth/seller portal",
        "Business Name & Contact Details",
        "Tax ID & Bank Payout Details",
        "Password or Google OAuth Signup",
        "Configurable Approval Gate",
        "Account Activation by Platform"
    ], badge="PHASE 1", badge_col="#38bdf8")

    content += card(355, 130, 275, 230, "2. Catalog & Products", [
        "Create New Product Listing",
        "Category Assignment",
        "Product Image Uploads",
        "Indian Rupee (INR) Pricing",
        "Discount Calculation & Badges",
        "Rich Technical Specifications"
    ], badge="PHASE 2", badge_col="#04DB7E", highlight=True)

    content += card(660, 130, 275, 230, "3. Inventory Control", [
        "Real-time Stock Quantity Audit",
        "Low-stock Threshold Alerts",
        "Batch Inventory Replenishment",
        "Automatic Out-of-Stock Lock",
        "Safety Buffer Reservation",
        "Multi-warehouse Tracking Ready"
    ], badge="PHASE 3", badge_col="#04DB7E")

    content += card(965, 130, 275, 230, "4. Order Processing", [
        "Live Inbound Order Notifications",
        "Inspect Customer Shipping Address",
        "Itemized Packing Slip Generation",
        "Status Update: PENDING -> SHIPPED",
        "Carrier Tracking Code Entry",
        "Confirm Delivery Hand-off"
    ], badge="PHASE 4", badge_col="#a855f7")

    content += card(1270, 130, 280, 230, "5. Revenue & Security", [
        "Gross Merchandise Value (GMV)",
        "Net Payouts & Commission Split",
        "Customer Feedback & Ratings",
        "Self-service Login Activity Audit",
        "IP & Geolocation Log Telemetry",
        "Store Security & Password Reset"
    ], badge="PHASE 5", badge_col="#f59e0b")

    # Connectors
    content += conn(325, 245, 355, 245, "Approved", col="#38bdf8")
    content += conn(630, 245, 660, 245, "Listed", col="#04DB7E")
    content += conn(935, 245, 965, 245, "Stocked", col="#04DB7E")
    content += conn(1240, 245, 1270, 245, "Fulfilled", col="#a855f7")

    # Bottom Panels
    content += """
    <rect x="50" y="390" width="1500" height="510" rx="12" fill="url(#tierGrad)" stroke="#222" stroke-width="1.2" />
    <text x="70" y="420" fill="#04DB7E" font-size="12" font-weight="700" letter-spacing="1">DEEP ARCHITECTURAL DIVE: MULTI-TENANT SELLER ISOLATION &amp; GOVERNANCE</text>
    """

    content += card(70, 440, 440, 210, "Multi-Tenant Data Scoping & Security", [
        "Row-Level Isolation: Sellers can ONLY query and mutate their own products and inventory",
        "Spring Data JPA enforces WHERE p.seller_id = :authenticatedSellerId",
        "Attempting to modify another merchant's product returns HTTP 403 FORBIDDEN",
        "Product creation verifies seller.role == ROLE_SELLER and enabled == true",
        "Sellers cannot escalate permissions or access administrative operations",
        "Session authentication validated by JwtAuthFilter on every incoming request"
    ], badge="DATA ISOLATION", badge_col="#04DB7E")

    content += card(540, 440, 440, 210, "Catalog Validation & Image Handling", [
        "Strict input validation: Title, Description, INR Price (> 0), Stock Quantity (>= 0)",
        "Category ID validated against active categories table",
        "Image upload to backend/data/uploads/ with secure UUID filename generation",
        "Path traversal prevention: Filenames sanitized; public access scoped to /uploads/**",
        "Automatic discount percentage calculation: ((price - discountPrice) / price) * 100",
        "Slug generation for clean SEO-friendly URLs"
    ], badge="CATALOG ENGINE", badge_col="#38bdf8")

    content += card(1010, 440, 520, 210, "Order Fulfillment Workflow", [
        "When an order is placed, order_items partitions items by seller_id",
        "Seller dashboard displays ONLY orders containing that seller's items",
        "Seller updates status from PENDING to PROCESSING when packaging begins",
        "Seller marks SHIPPED and attaches tracking reference code",
        "Customer receives instantaneous dashboard notifications of status transitions",
        "Final DELIVERED status transition enables customer review submission"
    ], badge="ORDER FULFILLMENT", badge_col="#a855f7")

    content += card(70, 670, 440, 200, "Financial Analytics & Settlements", [
        "Daily, weekly, and monthly sales volume and revenue charts",
        "Itemized payout breakdown after platform marketplace fee deduction",
        "Payment reconciliation linked directly to Razorpay payment identifiers",
        "Transparent refund deductions for returned merchandise",
        "Top-selling product performance metrics and inventory velocity",
        "Exportable financial reports for merchant accounting"
    ], badge="FINANCIAL ENGINE", badge_col="#10b981")

    content += card(540, 670, 440, 200, "Reputation & Customer Reviews", [
        "Seller dashboard aggregates all customer reviews for their product inventory",
        "Distribution charts of 5-star through 1-star ratings",
        "Seller can view customer feedback headlines, comments, and timestamps",
        "High seller ratings improve search ranking and marketplace visibility",
        "Low-rated products flagged automatically for merchant quality inspection",
        "Admin moderation protects merchants against fraudulent review brigading"
    ], badge="REPUTATION ENGINE", badge_col="#f59e0b")

    content += card(1010, 670, 520, 200, "Seller Security & Login Activity", [
        "Seller accesses personal security log at /seller/login-activity",
        "Shows total sign-in count, current IP address, and last login timestamp",
        "Detailed list of recent logins with device, browser, OS, and approx. location",
        "Failed login attempts recorded with reason codes (e.g., INVALID_CREDENTIALS)",
        "Direct link to self-service password update in Seller Profile",
        "Protected by Spring Security: Sellers cannot inspect customer or admin logs"
    ], badge="SECURITY TELEMETRY", badge_col="#04DB7E", highlight=True)

    svg_data = wrap_svg(w, h, title, subtitle, content)
    with open(os.path.join(OUT_DIR, "03-seller-workflow.svg"), "w", encoding="utf-8") as f:
        f.write(svg_data)

    cells = """
        <mxCell id="s1" value="Phase 1: Registration &amp; Onboarding" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#38bdf8;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="50" y="130" width="275" height="230" as="geometry"/></mxCell>
        <mxCell id="s2" value="Phase 2: Catalog &amp; Products" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="355" y="130" width="275" height="230" as="geometry"/></mxCell>
        <mxCell id="s3" value="Phase 3: Inventory Control" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#04DB7E;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="660" y="130" width="275" height="230" as="geometry"/></mxCell>
        <mxCell id="s4" value="Phase 4: Order Processing" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#a855f7;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="965" y="130" width="275" height="230" as="geometry"/></mxCell>
        <mxCell id="s5" value="Phase 5: Revenue &amp; Security" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#101010;strokeColor=#f59e0b;fontColor=#FFFFFF;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="1270" y="130" width="280" height="230" as="geometry"/></mxCell>
    """
    with open(os.path.join(OUT_DIR, "03-seller-workflow.drawio"), "w", encoding="utf-8") as f:
        f.write(make_drawio(title, cells))

    print("Generated Diagram 3: Seller Workflow")

if __name__ == "__main__":
    gen_diagram_1()
    gen_diagram_2()
    gen_diagram_3()

