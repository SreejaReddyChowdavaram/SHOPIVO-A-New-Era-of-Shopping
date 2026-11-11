-- ===========================================================================
-- V21__marketplace_demo_reset_and_reseed.sql
-- SHOPIVO Marketplace Demo Reset & Reseed — College Faculty Demonstration
-- ===========================================================================
-- Strategy:
--   • Preserve admin@shopivo.com unconditionally (role='ADMIN')
--   • CASCADE deletes all non-admin user data via FK constraints
--   • INSERT 5 brand sellers + 10 customers + 37 products
--   • All Seller passwords: Seller@Demo2026!  (BCrypt cost-12)
--   • All Customer passwords: Shopivo@Demo2026! (BCrypt cost-12)
--   • Products use Unsplash CDN URLs (public, no auth required)
--   • All products status=APPROVED for immediate visibility
--   • Idempotent: ON CONFLICT DO NOTHING on unique columns
-- ===========================================================================

-- ── STEP 1: Remove all non-admin users (cascades delete their data) ──────────
-- ON DELETE CASCADE relationships handle:
--   users → carts → cart_items
--   users → wishlists → wishlist_items
--   users → password_reset_otps
--   users → notifications (customer_id FK)
--   users → orders → order_items, payments, return_requests → refunds
--   users → reviews (customer_id FK)
--   users → addresses
--   users → products (seller_id FK) → cart_items, wishlist_items, reviews

DELETE FROM users WHERE role <> 'ADMIN';

-- ── STEP 2: Insert 5 Brand Sellers ──────────────────────────────────────────
-- Password: Seller@Demo2026! — BCrypt cost-12
-- Hash: $2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa

INSERT INTO users (email, password_hash, first_name, last_name, role, enabled, created_at, updated_at) VALUES
('seller@technova.shopivo.demo',
 '$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa',
 'TechNova', 'Electronics', 'SELLER', TRUE,
 NOW() - INTERVAL '180 days', NOW() - INTERVAL '2 days'),

('seller@urbanstyle.shopivo.demo',
 '$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa',
 'UrbanStyle', 'Fashion', 'SELLER', TRUE,
 NOW() - INTERVAL '155 days', NOW() - INTERVAL '1 day'),

('seller@homenest.shopivo.demo',
 '$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa',
 'HomeNest', 'Living', 'SELLER', TRUE,
 NOW() - INTERVAL '130 days', NOW() - INTERVAL '3 days'),

('seller@beautybloom.shopivo.demo',
 '$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa',
 'BeautyBloom', 'Store', 'SELLER', TRUE,
 NOW() - INTERVAL '110 days', NOW() - INTERVAL '1 day'),

('seller@fitzone.shopivo.demo',
 '$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa',
 'FitZone', 'Sports', 'SELLER', TRUE,
 NOW() - INTERVAL '95 days', NOW() - INTERVAL '2 days')
ON CONFLICT (email) DO NOTHING;

-- ── STEP 3: Insert 10 Demo Customers ────────────────────────────────────────
-- Password: Shopivo@Demo2026! — BCrypt cost-12
-- Hash: $2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y

INSERT INTO users (email, password_hash, first_name, last_name, role, enabled, created_at, updated_at) VALUES
('ravi.kumar@shopivo.demo',
 '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y',
 'Ravi', 'Kumar', 'CUSTOMER', TRUE,
 NOW() - INTERVAL '85 days', NOW() - INTERVAL '2 days'),

('sravani.reddy@shopivo.demo',
 '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y',
 'Sravani', 'Reddy', 'CUSTOMER', TRUE,
 NOW() - INTERVAL '78 days', NOW() - INTERVAL '3 days'),

('harsha.vardhan@shopivo.demo',
 '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y',
 'Harsha', 'Vardhan', 'CUSTOMER', TRUE,
 NOW() - INTERVAL '70 days', NOW() - INTERVAL '5 days'),

('keerthana.rao@shopivo.demo',
 '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y',
 'Keerthana', 'Rao', 'CUSTOMER', TRUE,
 NOW() - INTERVAL '63 days', NOW() - INTERVAL '1 day'),

('anjali.sharma@shopivo.demo',
 '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y',
 'Anjali', 'Sharma', 'CUSTOMER', TRUE,
 NOW() - INTERVAL '55 days', NOW() - INTERVAL '4 days'),

('rohit.verma@shopivo.demo',
 '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y',
 'Rohit', 'Verma', 'CUSTOMER', TRUE,
 NOW() - INTERVAL '48 days', NOW() - INTERVAL '6 days'),

('priya.nair@shopivo.demo',
 '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y',
 'Priya', 'Nair', 'CUSTOMER', TRUE,
 NOW() - INTERVAL '40 days', NOW() - INTERVAL '2 days'),

('arjun.mehta@shopivo.demo',
 '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y',
 'Arjun', 'Mehta', 'CUSTOMER', TRUE,
 NOW() - INTERVAL '33 days', NOW() - INTERVAL '1 day'),

('naveen.krishna@shopivo.demo',
 '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y',
 'Naveen', 'Krishna', 'CUSTOMER', TRUE,
 NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days'),

('divya.patel@shopivo.demo',
 '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y',
 'Divya', 'Patel', 'CUSTOMER', TRUE,
 NOW() - INTERVAL '18 days', NOW() - INTERVAL '2 days')
ON CONFLICT (email) DO NOTHING;

-- ── STEP 4: Seed Customer Addresses ─────────────────────────────────────────
DO $$
DECLARE
  uid_ravi      BIGINT; uid_sravani   BIGINT; uid_harsha    BIGINT;
  uid_keerthana BIGINT; uid_anjali    BIGINT; uid_rohit     BIGINT;
  uid_priya     BIGINT; uid_arjun     BIGINT; uid_naveen    BIGINT;
  uid_divya     BIGINT;
BEGIN
  SELECT id INTO uid_ravi      FROM users WHERE email = 'ravi.kumar@shopivo.demo';
  SELECT id INTO uid_sravani   FROM users WHERE email = 'sravani.reddy@shopivo.demo';
  SELECT id INTO uid_harsha    FROM users WHERE email = 'harsha.vardhan@shopivo.demo';
  SELECT id INTO uid_keerthana FROM users WHERE email = 'keerthana.rao@shopivo.demo';
  SELECT id INTO uid_anjali    FROM users WHERE email = 'anjali.sharma@shopivo.demo';
  SELECT id INTO uid_rohit     FROM users WHERE email = 'rohit.verma@shopivo.demo';
  SELECT id INTO uid_priya     FROM users WHERE email = 'priya.nair@shopivo.demo';
  SELECT id INTO uid_arjun     FROM users WHERE email = 'arjun.mehta@shopivo.demo';
  SELECT id INTO uid_naveen    FROM users WHERE email = 'naveen.krishna@shopivo.demo';
  SELECT id INTO uid_divya     FROM users WHERE email = 'divya.patel@shopivo.demo';

  INSERT INTO addresses (user_id, label, full_name, phone, line1, city, state, postal_code, country, is_default)
  SELECT uid_ravi, 'Home', 'Ravi Kumar', '9876501001', '14-2-45, Balaji Nagar', 'Tirupati', 'Andhra Pradesh', '517501', 'India', TRUE
  WHERE uid_ravi IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = uid_ravi AND label = 'Home');

  INSERT INTO addresses (user_id, label, full_name, phone, line1, city, state, postal_code, country, is_default)
  SELECT uid_sravani, 'Home', 'Sravani Reddy', '9876502002', '5-7, Jaganmohan Colony', 'Vijayawada', 'Andhra Pradesh', '520010', 'India', TRUE
  WHERE uid_sravani IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = uid_sravani AND label = 'Home');

  INSERT INTO addresses (user_id, label, full_name, phone, line1, city, state, postal_code, country, is_default)
  SELECT uid_harsha, 'Home', 'Harsha Vardhan', '9876503003', '8-1-22, KPHB Colony', 'Hyderabad', 'Telangana', '500072', 'India', TRUE
  WHERE uid_harsha IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = uid_harsha AND label = 'Home');

  INSERT INTO addresses (user_id, label, full_name, phone, line1, city, state, postal_code, country, is_default)
  SELECT uid_keerthana, 'Home', 'Keerthana Rao', '9876504004', '12-A, Jayanagar 4th Block', 'Bengaluru', 'Karnataka', '560011', 'India', TRUE
  WHERE uid_keerthana IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = uid_keerthana AND label = 'Home');

  INSERT INTO addresses (user_id, label, full_name, phone, line1, city, state, postal_code, country, is_default)
  SELECT uid_anjali, 'Home', 'Anjali Sharma', '9876505005', 'B-204, Andheri West', 'Mumbai', 'Maharashtra', '400058', 'India', TRUE
  WHERE uid_anjali IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = uid_anjali AND label = 'Home');

  INSERT INTO addresses (user_id, label, full_name, phone, line1, city, state, postal_code, country, is_default)
  SELECT uid_rohit, 'Home', 'Rohit Verma', '9876506006', '45, Sector 18, Noida', 'Noida', 'Uttar Pradesh', '201301', 'India', TRUE
  WHERE uid_rohit IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = uid_rohit AND label = 'Home');

  INSERT INTO addresses (user_id, label, full_name, phone, line1, city, state, postal_code, country, is_default)
  SELECT uid_priya, 'Home', 'Priya Nair', '9876507007', 'TC-18, Vellayambalam', 'Thiruvananthapuram', 'Kerala', '695003', 'India', TRUE
  WHERE uid_priya IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = uid_priya AND label = 'Home');

  INSERT INTO addresses (user_id, label, full_name, phone, line1, city, state, postal_code, country, is_default)
  SELECT uid_arjun, 'Home', 'Arjun Mehta', '9876508008', '3rd Floor, Satellite Road', 'Ahmedabad', 'Gujarat', '380015', 'India', TRUE
  WHERE uid_arjun IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = uid_arjun AND label = 'Home');

  INSERT INTO addresses (user_id, label, full_name, phone, line1, city, state, postal_code, country, is_default)
  SELECT uid_naveen, 'Home', 'Naveen Krishna', '9876509009', '22, Anna Nagar East', 'Chennai', 'Tamil Nadu', '600102', 'India', TRUE
  WHERE uid_naveen IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = uid_naveen AND label = 'Home');

  INSERT INTO addresses (user_id, label, full_name, phone, line1, city, state, postal_code, country, is_default)
  SELECT uid_divya, 'Home', 'Divya Patel', '9876510010', '7, Civil Lines', 'Jaipur', 'Rajasthan', '302006', 'India', TRUE
  WHERE uid_divya IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = uid_divya AND label = 'Home');
END $$;

-- ── STEP 5: Insert 37 Products ───────────────────────────────────────────────
-- Electronics: category id=1 | Clothing/Fashion: id=2
-- Home & Kitchen: id=4 | Sports & Outdoors: id=5 | Beauty & Care: id=6
-- Status: APPROVED | Slugs are unique

DO $$
DECLARE
  sid_tech    BIGINT; sid_urban   BIGINT; sid_home    BIGINT;
  sid_beauty  BIGINT; sid_fit     BIGINT;
BEGIN
  SELECT id INTO sid_tech   FROM users WHERE email = 'seller@technova.shopivo.demo';
  SELECT id INTO sid_urban  FROM users WHERE email = 'seller@urbanstyle.shopivo.demo';
  SELECT id INTO sid_home   FROM users WHERE email = 'seller@homenest.shopivo.demo';
  SELECT id INTO sid_beauty FROM users WHERE email = 'seller@beautybloom.shopivo.demo';
  SELECT id INTO sid_fit    FROM users WHERE email = 'seller@fitzone.shopivo.demo';

  -- ── TechNova Electronics (8 products) ────────────────────────────────────
  INSERT INTO products (seller_id, category_id, name, slug, description, price, stock_quantity, image_url, status, created_at, updated_at)
  VALUES
  (sid_tech, 1,
   'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
   'sony-wh1000xm5-noise-cancelling-headphones',
   'Industry-leading noise cancelling with Dual Noise Sensor technology. Up to 30-hour battery life with quick charging. Crystal clear hands-free calling with our most precise voice pickup ever. Multipoint connection — connect to two Bluetooth devices simultaneously. Comfortable fit for all-day wear. Compatible with Alexa, Google Assistant and Siri.',
   29990.00, 45,
   'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '120 days', NOW() - INTERVAL '2 days'),

  (sid_tech, 1,
   'Apple AirPods Pro 2nd Generation with MagSafe Case',
   'apple-airpods-pro-2nd-gen-magsafe',
   'The new Apple AirPods Pro 2nd generation deliver up to 2x more Active Noise Cancellation than the previous generation. Transparency mode lets you hear the world around you. Personalized Spatial Audio with dynamic head tracking places sound all around you. Adaptive Audio seamlessly blends Active Noise Cancellation and Transparency mode. MagSafe Charging Case with built-in speaker and lanyard loop.',
   24900.00, 30,
   'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '115 days', NOW() - INTERVAL '1 day'),

  (sid_tech, 1,
   'Samsung 55-Inch QLED 4K Smart TV Q70C',
   'samsung-55-inch-qled-4k-smart-tv-q70c',
   'Quantum Dot technology produces 100% colour volume in the DCI-P3 colour space for the most realistic colours. Quantum Processor 4K uses AI upscaling to transform everything you watch into 4K. Object Tracking Sound+ matches the audio to the action on screen. Auto Game Mode (ALLM) automatically switches to Game Mode when a compatible console is connected. Built-in streaming services and SmartThings integration.',
   74990.00, 15,
   'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '110 days', NOW() - INTERVAL '3 days'),

  (sid_tech, 1,
   'MacBook Air M2 Chip 13-Inch 8GB RAM 256GB SSD',
   'macbook-air-m2-chip-13-inch-8gb-256gb',
   'Supercharged by the next-generation M2 chip. With an 8-core CPU and up to 10-core GPU, MacBook Air is remarkably fast and capable. The 13.6-inch Liquid Retina display is vivid and bright. MagSafe charging is back. Up to 18 hours of battery life. Up to 24GB of fast unified memory. All in an impossibly thin and light fanless design.',
   114900.00, 12,
   'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '108 days', NOW() - INTERVAL '4 days'),

  (sid_tech, 1,
   'Realme Narzo 70 Pro 5G Smartphone 8GB+128GB',
   'realme-narzo-70-pro-5g-8gb-128gb',
   'MediaTek Dimensity 7050 5G processor for seamless multitasking. 50MP Sony IMX890 OIS camera with AI Portrait mode. 6.7-inch Super AMOLED curved display with 120Hz refresh rate. 5000mAh battery with 67W SUPERVOOC fast charging. Under-display fingerprint sensor. 5G ready with 11 5G bands support in India.',
   22999.00, 60,
   'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '100 days', NOW() - INTERVAL '2 days'),

  (sid_tech, 1,
   'Logitech MX Master 3S Wireless Mouse',
   'logitech-mx-master-3s-wireless-mouse',
   'Ultra-precise 8000 DPI optical sensor tracks on any surface including glass. MagSpeed electromagnetic scroll wheel scrolls 1000 lines per second. Quiet Click buttons with 90% less click noise than the previous generation. Ergonomic design sculpted for right-hand comfort. Connect via Bluetooth or USB receiver. Up to 70 days battery life. Compatible with Windows, macOS, Linux.',
   8999.00, 80,
   'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '95 days', NOW() - INTERVAL '1 day'),

  (sid_tech, 1,
   'GoPro HERO12 Black Action Camera 5.3K',
   'gopro-hero12-black-action-camera-5k3',
   'Shoots incredibly smooth, stabilised video at 5.3K60 and 4K120 with HyperSmooth 6.0 — the best stabilisation ever from GoPro. 27MP Photos with RAW support. GP-Log preserves the most dynamic range for professional colour grading. Waterproof up to 10m without a housing.',
   37990.00, 25,
   'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '88 days', NOW() - INTERVAL '5 days'),

  (sid_tech, 1,
   'Anker 727 Charging Station 100W GaN Desktop Charger',
   'anker-727-charging-station-100w-gan',
   'Charges multiple devices simultaneously with 4 USB ports and 2 AC outlets. 100W total output with Anker''s GaN technology runs cooler and more efficiently. Charges MacBook Pro 14-inch at full speed with Power Delivery. ActiveShield 2.0 monitors device temperature 3 million times per day. Compact desktop design saves space.',
   5499.00, 150,
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '82 days', NOW() - INTERVAL '2 days')
  ON CONFLICT (slug) DO NOTHING;

  -- ── UrbanStyle Fashion (8 products) ──────────────────────────────────────
  INSERT INTO products (seller_id, category_id, name, slug, description, price, stock_quantity, image_url, status, created_at, updated_at)
  VALUES
  (sid_urban, 2,
   'Men''s Premium Oxford Cotton Shirt — Slim Fit',
   'mens-premium-oxford-cotton-shirt-slim-fit',
   'Classic Oxford weave with a modern slim-fit cut. Crafted from 100% combed cotton for breathability and comfort. Button-down collar with single button cuffs. Perfect for formal office wear or smart casual outings. Available in White, Light Blue, Blush Pink and Olive. Machine washable. Sizes available: S, M, L, XL, XXL.',
   1799.00, 120,
   'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '130 days', NOW() - INTERVAL '1 day'),

  (sid_urban, 2,
   'Women''s Rayon Printed Palazzo Set with Dupatta',
   'womens-rayon-printed-palazzo-set-dupatta',
   'Flowy rayon fabric with vibrant block print. 3-piece set includes a straight-cut kurti, wide-leg palazzo pants and a matching dupatta. Flattering silhouette for all body types. Breathable and lightweight — ideal for warm Indian summers. Easy care — machine washable, retains colour vibrancy wash after wash. Sizes: XS to 3XL.',
   1299.00, 200,
   'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '125 days', NOW() - INTERVAL '2 days'),

  (sid_urban, 2,
   'Men''s Slim Fit Denim Jeans — Stretch Comfort Waist',
   'mens-slim-fit-denim-jeans-stretch-comfort',
   'Premium 98% cotton 2% elastane blend for comfort and stretch. Slim fit from hip to ankle with modern taper. Five-pocket classic styling with YKK zipper. Mid-rise waistband with stretch for all-day comfort. Available in Dark Blue, Stone Wash, Black and Grey. Waist 28 to 42, Length 30 to 36.',
   1599.00, 180,
   'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '120 days', NOW() - INTERVAL '3 days'),

  (sid_urban, 2,
   'Women''s Cotton A-Line Midi Dress with Pockets',
   'womens-cotton-aline-midi-dress-pockets',
   'Effortlessly elegant A-line silhouette falling just below the knee. 100% breathable cotton in a relaxed fit perfect for all-day wear. Features two deep side pockets. Round neck with short flutter sleeves. Available in Navy, Sage Green, Terracotta and Dusty Rose. Sizes: XS to 2XL.',
   1899.00, 95,
   'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '115 days', NOW() - INTERVAL '2 days'),

  (sid_urban, 2,
   'Men''s Linen Casual Shirt — Half Sleeve Summer',
   'mens-linen-casual-shirt-half-sleeve-summer',
   'Premium linen blend (55% linen, 45% cotton) stays cool in Indian summer heat. Relaxed fit with a spread collar and chest pocket. Perfect for beach holidays, casual outings and weekend brunch. Pre-washed for a soft hand feel right out of the box. Available in Off-White, Sky Blue, Mango Yellow and Pista Green. Sizes: S, M, L, XL, XXL.',
   999.00, 250,
   'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '108 days', NOW() - INTERVAL '4 days'),

  (sid_urban, 2,
   'Women''s Pure Silk Saree with Blouse Piece — Kanjivaram Inspired',
   'womens-silk-saree-blouse-kanjivaram',
   'Art silk weave inspired by traditional Kanjivaram motifs. Lustrous sheen with contrasting zari border. 5.5 metres of fabric plus a 0.9 metre blouse piece included. Classic pallu with intricate peacock and floral woven patterns. Perfect for festivals, weddings and formal occasions. Available in Deep Red, Royal Blue, Emerald Green and Mustard Gold.',
   4999.00, 40,
   'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '100 days', NOW() - INTERVAL '3 days'),

  (sid_urban, 2,
   'Unisex Oversized Graphic Hoodie — 380GSM Fleece',
   'unisex-oversized-graphic-hoodie-380gsm',
   '380 GSM heavyweight fleece for ultimate warmth and comfort. Oversized drop-shoulder silhouette inspired by streetwear aesthetics. Front kangaroo pocket with ribbed cuffs and hem. Pre-shrunk — stays true to size wash after wash. All graphic prints are eco-friendly water-based inks. Unisex sizing: XS to 2XL.',
   1499.00, 160,
   'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '92 days', NOW() - INTERVAL '2 days'),

  (sid_urban, 2,
   'Women''s Formal Blazer — Tailored Single Button',
   'womens-formal-blazer-tailored-single-button',
   'Structured tailored blazer in premium polyester-viscose blend. Single-button closure with notched lapels. Two front flap pockets and one chest pocket. Fully lined interior for a polished drape. Slim-fit silhouette that pairs beautifully with trousers, jeans or skirts. Perfect for professional interviews, meetings and corporate events. Available in Black, Navy, Camel and Charcoal Grey. Sizes: XS to 2XL.',
   2499.00, 75,
   'https://images.unsplash.com/photo-1580657018950-c7f7d6a6d990?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '85 days', NOW() - INTERVAL '1 day')
  ON CONFLICT (slug) DO NOTHING;

  -- ── HomeNest Living (7 products) ──────────────────────────────────────────
  INSERT INTO products (seller_id, category_id, name, slug, description, price, stock_quantity, image_url, status, created_at, updated_at)
  VALUES
  (sid_home, 4,
   'Borosil Glass Storage Jar Set of 7 with Airtight Lids',
   'borosil-glass-storage-jar-set-7-airtight',
   'Borosilicate glass jars — heat resistant, BPA-free and odour-free. Set of 7 jars in assorted sizes (200ml to 2L). Airtight stainless steel clip lids preserve freshness for weeks. Microwave, oven and dishwasher safe. Perfect for storing dry foods, spices, snacks, cereals and beverages.',
   1799.00, 85,
   'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '130 days', NOW() - INTERVAL '2 days'),

  (sid_home, 4,
   'Prestige Svachh 5L Pressure Cooker with Deep Lid',
   'prestige-svachh-5l-pressure-cooker-deep-lid',
   'Svachh (clean) series with recessed lid for hygienic cooking. 5-litre capacity — perfect for families of 4-6. Inner lid design prevents food spills. Tri-ply base for even heat distribution. Compatible with gas, induction and ceramic cooktops. Includes recipe booklet. 2 years manufacturer warranty.',
   2299.00, 60,
   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '122 days', NOW() - INTERVAL '3 days'),

  (sid_home, 4,
   'Nilkamal Orthopaedic Memory Foam Mattress 6-Inch King',
   'nilkamal-ortho-memory-foam-mattress-6inch-king',
   '6-inch thickness with 3-layered construction: comfort foam, memory foam and orthopaedic support base. High-density 40D orthopaedic foam relieves pressure points. Temperature-sensitive memory foam adapts to body heat. Knitted jacquard fabric cover is removable and washable. Standard King size: 72 x 72 inches. 10-year warranty.',
   18999.00, 20,
   'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '115 days', NOW() - INTERVAL '4 days'),

  (sid_home, 4,
   'Philips Air Fryer HD9252 4.1L Digital',
   'philips-air-fryer-hd9252-4l-digital',
   'Up to 90% less fat than deep frying using Rapid Air technology. 4.1-litre capacity — feeds up to 4 people. Digital touch panel with 7 preset cooking programmes. Temperature range 80°C to 200°C. 30-minute timer with auto shutoff. Dishwasher-safe drawer and basket. 1400W power consumption. 2-year warranty.',
   7999.00, 55,
   'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '108 days', NOW() - INTERVAL '2 days'),

  (sid_home, 4,
   'Godrej Interio 6-Piece Modular Kitchen Organiser Set',
   'godrej-interio-6pc-modular-kitchen-organiser',
   'Complete kitchen organisation system with 6 interchangeable modules. Includes drawer organiser, spice rack, cutlery tray, pot lid holder, cabinet shelf riser and undershelf basket. Made from food-safe BPA-free polypropylene. Easy no-tool assembly — snap-fit design. Available in Ivory White and Slate Grey.',
   1299.00, 100,
   'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '100 days', NOW() - INTERVAL '3 days'),

  (sid_home, 4,
   'Story@Home 450TC Egyptian Cotton Bedsheet Set — King',
   'story-at-home-450tc-egyptian-cotton-bedsheet-king',
   '450 thread count Egyptian cotton for a hotel-like sleeping experience. 3-piece set includes a flat bedsheet, fitted sheet and 2 pillow covers. Sateen weave for silky smooth feel. Fade-resistant colour up to 60°C machine wash. Available in Ivory, Steel Blue, Dusty Lilac and Sage. King size.',
   2799.00, 65,
   'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '92 days', NOW() - INTERVAL '1 day'),

  (sid_home, 4,
   'iBell Prism 1.8L Stainless Steel Electric Kettle',
   'ibell-prism-18l-stainless-steel-electric-kettle',
   '1.8-litre capacity — perfect for 4-6 cups of tea or coffee. Food-grade 304 stainless steel interior — no plastic contact with water. Concealed spiral heating element for easy cleaning. Auto shutoff and boil-dry protection for safety. 360° swivel base. 1500W for quick boiling under 5 minutes. 1-year warranty.',
   1499.00, 90,
   'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '85 days', NOW() - INTERVAL '2 days')
  ON CONFLICT (slug) DO NOTHING;

  -- ── BeautyBloom Store (7 products) ────────────────────────────────────────
  INSERT INTO products (seller_id, category_id, name, slug, description, price, stock_quantity, image_url, status, created_at, updated_at)
  VALUES
  (sid_beauty, 6,
   'Mamaearth Vitamin C Face Serum with Turmeric 30ml',
   'mamaearth-vitamin-c-face-serum-turmeric-30ml',
   'Clinically tested formula with 15% Vitamin C and 1% Turmeric extract. Visibly brightens skin and reduces dark spots and pigmentation in 4 weeks. Free from parabens, sulphates, artificial colours and fragrances. MADE SAFE certified. Lightweight serum absorbs quickly without stickiness. Suitable for all skin types including sensitive skin.',
   549.00, 300,
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '110 days', NOW() - INTERVAL '1 day'),

  (sid_beauty, 6,
   'L''Oreal Paris Revitalift 1.5% Pure Hyaluronic Acid Serum 30ml',
   'loreal-revitalift-hyaluronic-acid-serum-30ml',
   'Clinically proven to visibly reduce wrinkles and intensely plump skin in 1 week. Concentrated formula with 1.5% Pure Hyaluronic Acid. Micro and Macro Hyaluronic Acid molecules penetrate skin at different depths for multi-level hydration. Fragrance-free, dermatologist tested and suitable for sensitive skin.',
   899.00, 200,
   'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '105 days', NOW() - INTERVAL '2 days'),

  (sid_beauty, 6,
   'Forest Essentials Facial Ubtan Brightening Face Pack 100g',
   'forest-essentials-ubtan-brightening-face-pack-100g',
   'Traditional Ayurvedic formulation with Haldi (turmeric), Chandan (sandalwood), Kesar (saffron) and Multani Mitti. Exfoliates dead skin cells, brightens complexion and imparts a natural glow. Free from synthetic chemicals, parabens, sulphates and mineral oils. Suitable for all skin types. 100g jar lasts approximately 60 uses.',
   1250.00, 120,
   'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '98 days', NOW() - INTERVAL '3 days'),

  (sid_beauty, 6,
   'Khadi Natural Keratin Repair Shampoo 300ml',
   'khadi-natural-keratin-repair-shampoo-300ml',
   'Keratin-enriched formula repairs and strengthens damaged hair from root to tip. Enriched with Argan oil, Bhringraj and Shikakai for deep nourishment. Sulphate and paraben free — gentle enough for colour-treated and chemically processed hair. 300ml bottle. Suitable for all hair types.',
   349.00, 400,
   'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '90 days', NOW() - INTERVAL '2 days'),

  (sid_beauty, 6,
   'Biotique Bio Coconut Whitening and Brightening Cream 50g',
   'biotique-bio-coconut-whitening-brightening-cream-50g',
   'Pure Ayurvedic formula with coconut cream, dandelion extract and turmeric. Visibly brightens and evens skin tone with regular use. SPF 25 UVA/UVB protection for daytime use. Lightweight non-greasy texture suitable for Indian climate. Clinically tested, hypoallergenic formula. Free from synthetic fragrances. 50g — compact size for travel.',
   179.00, 500,
   'https://images.unsplash.com/photo-1556228578-567ba127e37f?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '82 days', NOW() - INTERVAL '1 day'),

  (sid_beauty, 6,
   'Sugar Cosmetics Matte Attack Transferproof Lipstick',
   'sugar-cosmetics-matte-attack-transferproof-lipstick',
   'Ultra-long lasting matte formula that stays put for 12 hours without touch-ups. Transfer-proof and smudge-proof formula comfortable to wear all day. Enriched with Vitamin E for moisture. Indian skin tone inclusive shade range: 36 shades from nudes to bolds. Slim precision bullet tip for detailed lip liner application. Cruelty-free and vegan formula.',
   499.00, 350,
   'https://images.unsplash.com/photo-1664575262619-b28fef7a40a4?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '75 days', NOW() - INTERVAL '2 days'),

  (sid_beauty, 6,
   'The Ordinary Niacinamide 10% + Zinc 1% Serum 30ml',
   'the-ordinary-niacinamide-10-zinc-1-serum-30ml',
   'High-strength vitamin and mineral blemish formula. Niacinamide (Vitamin B3) reduces the appearance of skin blemishes and congestion. 1% Zinc PCA helps balance sebum production. Suitable for all skin types especially acne-prone and oily skin. Vegan and cruelty-free. No added fragrance, alcohol or parabens. Genuine imported product.',
   799.00, 180,
   'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '68 days', NOW() - INTERVAL '3 days')
  ON CONFLICT (slug) DO NOTHING;

  -- ── FitZone Sports (7 products) ───────────────────────────────────────────
  INSERT INTO products (seller_id, category_id, name, slug, description, price, stock_quantity, image_url, status, created_at, updated_at)
  VALUES
  (sid_fit, 5,
   'Nivia Storm Football Size 5 — Match Quality',
   'nivia-storm-football-size-5-match',
   'FIFA-quality match football hand-stitched with premium synthetic leather. 32-panel construction for true spherical shape. Butyl rubber bladder retains air for longer. High-visibility design with contrasting colour panels. Size 5 — official tournament and adult training size. Includes inflation needle.',
   799.00, 120,
   'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '95 days', NOW() - INTERVAL '1 day'),

  (sid_fit, 5,
   'Yonex Nanoray Dynamic Series Badminton Racquet',
   'yonex-nanoray-dynamic-badminton-racquet',
   'Ultra-slim shaft and Dynamic Optimum Frame gives maximum repulsion power. Nanomesh + Carbon Nanotube delivers incredible solid feel on impact. Isometric head shape enlarges the sweet spot. Pre-strung with BG65 strings at 24 lbs for immediate play. Full-length racquet cover included. Weight: 85g. Available in Black/Gold and Red/Black.',
   2799.00, 65,
   'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '90 days', NOW() - INTERVAL '2 days'),

  (sid_fit, 5,
   'Boldfit Premium Gym Gloves with Wrist Support',
   'boldfit-premium-gym-gloves-wrist-support',
   'Full palm padding with microfibre and neoprene construction for maximum grip and protection. Integrated wrist wrap for added support during heavy lifts. Open back design with pull-off tab for easy removal. Anti-slip silicone dots on palm for secure grip. Suitable for weight training, pull-ups, cycling and cross-training. Machine washable.',
   599.00, 200,
   'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '85 days', NOW() - INTERVAL '3 days'),

  (sid_fit, 5,
   'Kiprun KS900 Running Shoes — Men''s',
   'kiprun-ks900-running-shoes-mens',
   'Designed for high-mileage training by running shoe expert team in collaboration with elite runners. DUAL FOAM cushioning system combines a soft outer foam with a firmer responsive inner foam. Carbon plate in midsole provides propulsion for race pace. Breathable mesh upper reduces heat build-up. Drop: 6mm. Weight: 240g (Size UK 8). Sizes: UK 6 to 12.',
   8999.00, 50,
   'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '80 days', NOW() - INTERVAL '2 days'),

  (sid_fit, 5,
   'Healthgenie 90kg Capacity Digital Weighing Scale',
   'healthgenie-90kg-digital-weighing-scale',
   '90kg maximum capacity with 100g accuracy. Auto-zero technology for consistent accurate readings. Automatic on/off saves battery life. Tempered 6mm glass platform for safety and durability. Large 55mm LCD display easy to read. 4 high-precision sensors. Low battery indicator. 4 x AAA batteries included. Auto-calibration ensures consistent accuracy.',
   999.00, 180,
   'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '75 days', NOW() - INTERVAL '1 day'),

  (sid_fit, 5,
   'Strauss Adjustable Dumbbell Set 10kg Pair with Bag',
   'strauss-adjustable-dumbbell-set-10kg-pair-bag',
   'Adjustable weight from 2kg to 10kg per dumbbell — total 20kg of free weights. Chrome-plated iron plates with rubber end coating for floor protection and noise reduction. Secure locking collar prevents plate slippage during exercise. Ergonomic knurled chrome handle provides non-slip grip. Suitable for strength training, muscle building and toning. Includes carrying bag.',
   3499.00, 70,
   'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '70 days', NOW() - INTERVAL '2 days'),

  (sid_fit, 5,
   'Cockatoo CFR-05 Skipping Rope with Counter — Adult',
   'cockatoo-cfr05-skipping-rope-counter-adult',
   'Digital counter automatically tracks jump count and calories burned. Adjustable length rope fits heights from 5ft to 6.5ft. Lightweight PVC rope for smooth fast rotation. Ergonomic foam handles provide comfortable non-slip grip. Spinning ball bearings in handles for tangle-free rotation. Suitable for cardio, HIIT training, boxing and CrossFit. 1-year warranty.',
   349.00, 300,
   'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=600&q=80',
   'APPROVED', NOW() - INTERVAL '65 days', NOW() - INTERVAL '3 days')
  ON CONFLICT (slug) DO NOTHING;

END $$;
