-- ===========================================================================
-- V19__demo_seed_expansion.sql  --  EXPAND DEMO DATASET + FIX PASSWORD HASHES
-- ===========================================================================
-- PURPOSE:
--   1. Fix password hashes for ALL V15 demo users (hashes were not matching
--      documented passwords in credentials.local).
--   2. Create the ADMIN user (admin@shopivo.com) — was never seeded.
--   3. Add 5 new CUSTOMER accounts (to reach ~15 total).
--   4. Seed connected data: addresses, orders, payments, reviews for new customers.
--   5. Seed 2 demo return/refund records for demo completeness.
--
-- IDEMPOTENCY:
--   - User inserts: ON CONFLICT (email) DO NOTHING
--   - Address inserts: NOT EXISTS guard on (user_id, label)
--   - Order/Payment block: guarded by payment transaction_id existence check
--   - Reviews: ON CONFLICT (customer_id, product_id) DO NOTHING
--
-- PASSWORDS (BCrypt cost-12, $2a$ prefix for Java/Spring Security compatibility):
--   Customer: Customer@Shopivo2026!
--   Seller:   Seller@Shopivo2026!
--   Admin:    Admin@Shopivo2026!
-- ===========================================================================

-- ═══════════════════════════════════════════════════════════════
-- SECTION 1: FIX PASSWORD HASHES FOR EXISTING V15 DEMO USERS
-- ═══════════════════════════════════════════════════════════════
-- The V15 BCrypt hashes do not match the documented passwords.
-- Update all demo accounts to use correct hashes.

-- Customer password: Customer@Shopivo2026!
UPDATE users
SET password_hash = '$2a$12$2Z3Uq118iuUVzj2TcwUdxuNLzOpUZ0Nh0iES9Nl01lJJRvItO00rq',
    updated_at = NOW()
WHERE email IN (
    'ravi.kumar@shopivo.demo',
    'sravani.reddy@shopivo.demo',
    'harsha.vardhan@shopivo.demo',
    'keerthana.rao@shopivo.demo',
    'anjali.sharma@shopivo.demo',
    'rohit.verma@shopivo.demo',
    'priya.nair@shopivo.demo',
    'arjun.mehta@shopivo.demo',
    'naveen.krishna@shopivo.demo',
    'divya.patel@shopivo.demo'
)
AND password_hash != '$2a$12$2Z3Uq118iuUVzj2TcwUdxuNLzOpUZ0Nh0iES9Nl01lJJRvItO00rq';

-- Seller password: Seller@Shopivo2026!
UPDATE users
SET password_hash = '$2a$12$AxHhPYu05t9RWCEFIi18UulynPr8lvg7xIiGbGGKcGwB.9.X/G8u.',
    updated_at = NOW()
WHERE email IN (
    'raja.reddy@shopivo.demo',
    'srinivas.rao@shopivo.demo',
    'kiran.kumar@shopivo.demo',
    'mahesh.rao@shopivo.demo',
    'pavan.reddy@shopivo.demo',
    'rahul.sharma@shopivo.demo',
    'amit.verma@shopivo.demo',
    'vivek.kumar@shopivo.demo'
)
AND password_hash != '$2a$12$AxHhPYu05t9RWCEFIi18UulynPr8lvg7xIiGbGGKcGwB.9.X/G8u.';

-- Fix V3 legacy seller (had a placeholder hash)
UPDATE users
SET password_hash = '$2a$12$AxHhPYu05t9RWCEFIi18UulynPr8lvg7xIiGbGGKcGwB.9.X/G8u.',
    updated_at = NOW()
WHERE email = 'seller@securecommerce.dev'
AND password_hash LIKE '%placeholder%';


-- ═══════════════════════════════════════════════════════════════
-- SECTION 2: CREATE ADMIN USER
-- ═══════════════════════════════════════════════════════════════
-- Admin password: Admin@Shopivo2026!
INSERT INTO users (email, password_hash, first_name, last_name, role, enabled, created_at, updated_at)
VALUES (
    'admin@shopivo.com',
    '$2a$12$9HQbHAsRDPt26LOhErLG7.hfGwAbwHN3aipxYIv7ktyLbezjqiqqm',
    'Admin', 'Shopivo', 'ADMIN', TRUE,
    NOW() - INTERVAL '180 days', NOW()
) ON CONFLICT (email) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 3: ADD 5 NEW CUSTOMER ACCOUNTS (11-15)
-- ═══════════════════════════════════════════════════════════════
-- Customer password: Customer@Shopivo2026!
INSERT INTO users (email, password_hash, first_name, last_name, role, enabled, created_at, updated_at) VALUES
('meera.iyer@shopivo.demo','$2a$12$2Z3Uq118iuUVzj2TcwUdxuNLzOpUZ0Nh0iES9Nl01lJJRvItO00rq','Meera','Iyer','CUSTOMER',TRUE,NOW()-INTERVAL '15 days',NOW()-INTERVAL '1 day'),
('vikram.singh@shopivo.demo','$2a$12$2Z3Uq118iuUVzj2TcwUdxuNLzOpUZ0Nh0iES9Nl01lJJRvItO00rq','Vikram','Singh','CUSTOMER',TRUE,NOW()-INTERVAL '14 days',NOW()-INTERVAL '2 days'),
('lakshmi.narayanan@shopivo.demo','$2a$12$2Z3Uq118iuUVzj2TcwUdxuNLzOpUZ0Nh0iES9Nl01lJJRvItO00rq','Lakshmi','Narayanan','CUSTOMER',TRUE,NOW()-INTERVAL '12 days',NOW()-INTERVAL '1 day'),
('aditya.gupta@shopivo.demo','$2a$12$2Z3Uq118iuUVzj2TcwUdxuNLzOpUZ0Nh0iES9Nl01lJJRvItO00rq','Aditya','Gupta','CUSTOMER',TRUE,NOW()-INTERVAL '10 days',NOW()-INTERVAL '3 days'),
('sneha.kulkarni@shopivo.demo','$2a$12$2Z3Uq118iuUVzj2TcwUdxuNLzOpUZ0Nh0iES9Nl01lJJRvItO00rq','Sneha','Kulkarni','CUSTOMER',TRUE,NOW()-INTERVAL '8 days',NOW()-INTERVAL '1 day')
ON CONFLICT (email) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 4: ADDRESSES FOR NEW CUSTOMERS
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
    uid_meera BIGINT; uid_vikram BIGINT; uid_lakshmi BIGINT;
    uid_aditya BIGINT; uid_sneha BIGINT;
BEGIN
    SELECT id INTO uid_meera    FROM users WHERE email='meera.iyer@shopivo.demo';
    SELECT id INTO uid_vikram   FROM users WHERE email='vikram.singh@shopivo.demo';
    SELECT id INTO uid_lakshmi  FROM users WHERE email='lakshmi.narayanan@shopivo.demo';
    SELECT id INTO uid_aditya   FROM users WHERE email='aditya.gupta@shopivo.demo';
    SELECT id INTO uid_sneha    FROM users WHERE email='sneha.kulkarni@shopivo.demo';

    IF uid_meera IS NULL THEN RETURN; END IF;

    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_meera,'Home','Meera Iyer','9876511011','34, Koregaon Park Lane 5','Pune','Maharashtra','411001','India',TRUE
    WHERE NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_meera AND label='Home');

    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_vikram,'Home','Vikram Singh','9876512012','A-12, Malviya Nagar, MI Road','Jaipur','Rajasthan','302017','India',TRUE
    WHERE NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_vikram AND label='Home');

    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_lakshmi,'Home','Lakshmi Narayanan','9876513013','56, Race Course Road, RS Puram','Coimbatore','Tamil Nadu','641002','India',TRUE
    WHERE NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_lakshmi AND label='Home');

    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_aditya,'Home','Aditya Gupta','9876514014','18/3, Park Street, Elgin','Kolkata','West Bengal','700016','India',TRUE
    WHERE NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_aditya AND label='Home');

    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_sneha,'Home','Sneha Kulkarni','9876515015','Plot 9, Dharampeth Extension','Nagpur','Maharashtra','440010','India',TRUE
    WHERE NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_sneha AND label='Home');
END $$;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 5: ORDERS, PAYMENTS & ORDER ITEMS FOR NEW CUSTOMERS
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
    c_meera BIGINT; c_vikram BIGINT; c_lakshmi BIGINT;
    c_aditya BIGINT; c_sneha BIGINT;
    -- Existing products (APPROVED only)
    p_earbuds BIGINT; p_speaker BIGINT; p_charger BIGINT;
    p_cookware BIGINT; p_lamp BIGINT;
    p_kurta BIGINT; p_anarkali BIGINT; p_shoes BIGINT;
    p_camera BIGINT; p_stand BIGINT; p_chargepad BIGINT;
    p_bands BIGINT; p_dumbbells BIGINT; p_jumprope BIGINT;
    p_shirt BIGINT; p_palazzo BIGINT;
    p_niacinamide BIGINT; p_beard BIGINT; p_sunscreen BIGINT;
    p_alchemist BIGINT; p_atomic BIGINT;
    -- Sellers
    s_raja BIGINT; s_srinivas BIGINT; s_kiran BIGINT;
    s_mahesh BIGINT; s_pavan BIGINT; s_rahul BIGINT;
    s_amit BIGINT; s_vivek BIGINT;
    -- Order IDs
    o20 BIGINT; o21 BIGINT; o22 BIGINT; o23 BIGINT;
    o24 BIGINT; o25 BIGINT; o26 BIGINT;
BEGIN
    -- Lookup new customers
    SELECT id INTO c_meera    FROM users WHERE email='meera.iyer@shopivo.demo';
    SELECT id INTO c_vikram   FROM users WHERE email='vikram.singh@shopivo.demo';
    SELECT id INTO c_lakshmi  FROM users WHERE email='lakshmi.narayanan@shopivo.demo';
    SELECT id INTO c_aditya   FROM users WHERE email='aditya.gupta@shopivo.demo';
    SELECT id INTO c_sneha    FROM users WHERE email='sneha.kulkarni@shopivo.demo';

    -- Lookup sellers
    SELECT id INTO s_raja     FROM users WHERE email='raja.reddy@shopivo.demo';
    SELECT id INTO s_srinivas FROM users WHERE email='srinivas.rao@shopivo.demo';
    SELECT id INTO s_kiran    FROM users WHERE email='kiran.kumar@shopivo.demo';
    SELECT id INTO s_mahesh   FROM users WHERE email='mahesh.rao@shopivo.demo';
    SELECT id INTO s_pavan    FROM users WHERE email='pavan.reddy@shopivo.demo';
    SELECT id INTO s_rahul    FROM users WHERE email='rahul.sharma@shopivo.demo';
    SELECT id INTO s_amit     FROM users WHERE email='amit.verma@shopivo.demo';
    SELECT id INTO s_vivek    FROM users WHERE email='vivek.kumar@shopivo.demo';

    -- Lookup products
    SELECT id INTO p_earbuds    FROM products WHERE slug='true-wireless-earbuds-pro-raja';
    SELECT id INTO p_speaker    FROM products WHERE slug='portable-bluetooth-speaker-20w-raja';
    SELECT id INTO p_charger    FROM products WHERE slug='usb-c-65w-gan-fast-charger-raja';
    SELECT id INTO p_cookware   FROM products WHERE slug='stainless-steel-cookware-set-5pc-srinivas';
    SELECT id INTO p_lamp       FROM products WHERE slug='led-desk-lamp-usb-charging-srinivas';
    SELECT id INTO p_kurta      FROM products WHERE slug='mens-regular-fit-casual-kurta-kiran';
    SELECT id INTO p_anarkali   FROM products WHERE slug='womens-anarkali-kurti-floral-kiran';
    SELECT id INTO p_shoes      FROM products WHERE slug='mens-running-shoes-lightweight-kiran';
    SELECT id INTO p_camera     FROM products WHERE slug='smart-home-security-camera-1080p-mahesh';
    SELECT id INTO p_stand      FROM products WHERE slug='laptop-stand-adjustable-aluminium-mahesh';
    SELECT id INTO p_chargepad  FROM products WHERE slug='wireless-charging-pad-15w-mahesh';
    SELECT id INTO p_bands      FROM products WHERE slug='resistance-band-set-5-levels-pavan';
    SELECT id INTO p_dumbbells  FROM products WHERE slug='adjustable-dumbbell-set-10kg-pavan';
    SELECT id INTO p_jumprope   FROM products WHERE slug='jump-rope-speed-cable-skipping-pavan';
    SELECT id INTO p_shirt      FROM products WHERE slug='mens-oxford-formal-shirt-rahul';
    SELECT id INTO p_palazzo    FROM products WHERE slug='womens-palazzo-pants-set-rahul';
    SELECT id INTO p_niacinamide FROM products WHERE slug='niacinamide-10-face-serum-30ml-amit';
    SELECT id INTO p_beard      FROM products WHERE slug='beard-grooming-kit-7-in-1-amit';
    SELECT id INTO p_sunscreen  FROM products WHERE slug='sunscreen-spf50-pa-plus-100ml-amit';
    SELECT id INTO p_alchemist  FROM products WHERE slug='the-alchemist-paulo-coelho-vivek';
    SELECT id INTO p_atomic     FROM products WHERE slug='atomic-habits-james-clear-vivek';

    -- Safety checks
    IF c_meera IS NULL OR p_earbuds IS NULL OR s_raja IS NULL THEN RETURN; END IF;

    -- Idempotency: exit if V19 orders already exist
    IF EXISTS (SELECT 1 FROM payments WHERE transaction_id = 'DEMO-TXN-020-MEERA') THEN RETURN; END IF;

    -- ─── DELIVERED ORDER 20: Meera - Earbuds + Sunscreen ───────
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_meera,'Meera Iyer','9876511011','34, Koregaon Park Lane 5','Pune','Maharashtra','411001','India','DELIVERED',2948.00,2948.00,0.00,NOW()-INTERVAL '13 days',NOW()-INTERVAL '9 days') RETURNING id INTO o20;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o20,p_earbuds,s_raja,'True Wireless Earbuds Pro',2499.00,1,2499.00,NOW()-INTERVAL '13 days'),
    (o20,p_sunscreen,s_amit,'Sunscreen SPF 50 PA Plus 100ml',449.00,1,449.00,NOW()-INTERVAL '13 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o20,c_meera,'CARD','SUCCESS','DEMO-TXN-020-MEERA',2948.00,'SANDBOX_SECUREPAY','2345',NOW()-INTERVAL '13 days',NOW()-INTERVAL '13 days');

    -- ─── DELIVERED ORDER 21: Vikram - Dumbbells + Kurta ─────────
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_vikram,'Vikram Singh','9876512012','A-12, Malviya Nagar, MI Road','Jaipur','Rajasthan','302017','India','DELIVERED',5498.00,5498.00,0.00,NOW()-INTERVAL '12 days',NOW()-INTERVAL '8 days') RETURNING id INTO o21;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o21,p_dumbbells,s_pavan,'Adjustable Dumbbell Set 10kg',4599.00,1,4599.00,NOW()-INTERVAL '12 days'),
    (o21,p_kurta,s_kiran,'Mens Regular Fit Casual Kurta',899.00,1,899.00,NOW()-INTERVAL '12 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o21,c_vikram,'UPI','SUCCESS','DEMO-TXN-021-VIKRAM',5498.00,'SANDBOX_SECUREPAY','vikram@upi',NOW()-INTERVAL '12 days',NOW()-INTERVAL '12 days');

    -- ─── DELIVERED ORDER 22: Lakshmi - Lamp + Alchemist ────────
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_lakshmi,'Lakshmi Narayanan','9876513013','56, Race Course Road, RS Puram','Coimbatore','Tamil Nadu','641002','India','DELIVERED',1598.00,1598.00,0.00,NOW()-INTERVAL '10 days',NOW()-INTERVAL '6 days') RETURNING id INTO o22;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o22,p_lamp,s_srinivas,'LED Desk Lamp with USB Charging Port',1299.00,1,1299.00,NOW()-INTERVAL '10 days'),
    (o22,p_alchemist,s_vivek,'The Alchemist Paulo Coelho',299.00,1,299.00,NOW()-INTERVAL '10 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o22,c_lakshmi,'CARD','SUCCESS','DEMO-TXN-022-LAKSHMI',1598.00,'SANDBOX_SECUREPAY','6789',NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days');

    -- ─── DELIVERED ORDER 23: Aditya - Camera + Charger ─────────
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_aditya,'Aditya Gupta','9876514014','18/3, Park Street, Elgin','Kolkata','West Bengal','700016','India','DELIVERED',4598.00,4598.00,0.00,NOW()-INTERVAL '9 days',NOW()-INTERVAL '5 days') RETURNING id INTO o23;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o23,p_camera,s_mahesh,'Smart Home Security Camera 1080p',2899.00,1,2899.00,NOW()-INTERVAL '9 days'),
    (o23,p_charger,s_raja,'USB-C 65W GaN Fast Charger',1699.00,1,1699.00,NOW()-INTERVAL '9 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o23,c_aditya,'UPI','SUCCESS','DEMO-TXN-023-ADITYA',4598.00,'SANDBOX_SECUREPAY','aditya@upi',NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days');

    -- ─── DELIVERED ORDER 24: Sneha - Niacinamide + Anarkali + Palazzo ─
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_sneha,'Sneha Kulkarni','9876515015','Plot 9, Dharampeth Extension','Nagpur','Maharashtra','440010','India','DELIVERED',3148.00,3148.00,0.00,NOW()-INTERVAL '7 days',NOW()-INTERVAL '4 days') RETURNING id INTO o24;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o24,p_niacinamide,s_amit,'Niacinamide 10 Percent Face Serum 30ml',599.00,1,599.00,NOW()-INTERVAL '7 days'),
    (o24,p_anarkali,s_kiran,'Womens Anarkali Kurti Floral Print',1399.00,1,1399.00,NOW()-INTERVAL '7 days'),
    (o24,p_palazzo,s_rahul,'Womens Palazzo Pants Set',1150.00,1,1150.00,NOW()-INTERVAL '7 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o24,c_sneha,'CARD','SUCCESS','DEMO-TXN-024-SNEHA',3148.00,'SANDBOX_SECUREPAY','8888',NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days');

    -- ─── SHIPPED ORDER 25: Meera - Atomic Habits + Bands ──────
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_meera,'Meera Iyer','9876511011','34, Koregaon Park Lane 5','Pune','Maharashtra','411001','India','SHIPPED',1398.00,1398.00,0.00,NOW()-INTERVAL '5 days',NOW()-INTERVAL '3 days') RETURNING id INTO o25;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o25,p_atomic,s_vivek,'Atomic Habits James Clear',499.00,1,499.00,NOW()-INTERVAL '5 days'),
    (o25,p_bands,s_pavan,'Resistance Band Set 5-Levels',899.00,1,899.00,NOW()-INTERVAL '5 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o25,c_meera,'UPI','SUCCESS','DEMO-TXN-025-MEERA2',1398.00,'SANDBOX_SECUREPAY','meera@upi',NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days');

    -- ─── CONFIRMED ORDER 26: Vikram - Speaker ─────────────────
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_vikram,'Vikram Singh','9876512012','A-12, Malviya Nagar, MI Road','Jaipur','Rajasthan','302017','India','CONFIRMED',3299.00,3299.00,0.00,NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day') RETURNING id INTO o26;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o26,p_speaker,s_raja,'Portable Bluetooth Speaker 20W',3299.00,1,3299.00,NOW()-INTERVAL '2 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o26,c_vikram,'CARD','SUCCESS','DEMO-TXN-026-VIKRAM2',3299.00,'SANDBOX_SECUREPAY','4321',NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days');
END $$;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 6: REVIEWS FOR NEW CUSTOMERS (DELIVERED orders only)
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
    c_meera BIGINT; c_vikram BIGINT; c_lakshmi BIGINT;
    c_aditya BIGINT; c_sneha BIGINT;
    p_earbuds BIGINT; p_sunscreen BIGINT; p_dumbbells BIGINT;
    p_kurta BIGINT; p_lamp BIGINT; p_alchemist BIGINT;
    p_camera BIGINT; p_charger BIGINT;
    p_niacinamide BIGINT; p_anarkali BIGINT;
    o20 BIGINT; o21 BIGINT; o22 BIGINT; o23 BIGINT; o24 BIGINT;
BEGIN
    SELECT id INTO c_meera    FROM users WHERE email='meera.iyer@shopivo.demo';
    SELECT id INTO c_vikram   FROM users WHERE email='vikram.singh@shopivo.demo';
    SELECT id INTO c_lakshmi  FROM users WHERE email='lakshmi.narayanan@shopivo.demo';
    SELECT id INTO c_aditya   FROM users WHERE email='aditya.gupta@shopivo.demo';
    SELECT id INTO c_sneha    FROM users WHERE email='sneha.kulkarni@shopivo.demo';

    SELECT id INTO p_earbuds     FROM products WHERE slug='true-wireless-earbuds-pro-raja';
    SELECT id INTO p_sunscreen   FROM products WHERE slug='sunscreen-spf50-pa-plus-100ml-amit';
    SELECT id INTO p_dumbbells   FROM products WHERE slug='adjustable-dumbbell-set-10kg-pavan';
    SELECT id INTO p_kurta       FROM products WHERE slug='mens-regular-fit-casual-kurta-kiran';
    SELECT id INTO p_lamp        FROM products WHERE slug='led-desk-lamp-usb-charging-srinivas';
    SELECT id INTO p_alchemist   FROM products WHERE slug='the-alchemist-paulo-coelho-vivek';
    SELECT id INTO p_camera      FROM products WHERE slug='smart-home-security-camera-1080p-mahesh';
    SELECT id INTO p_charger     FROM products WHERE slug='usb-c-65w-gan-fast-charger-raja';
    SELECT id INTO p_niacinamide FROM products WHERE slug='niacinamide-10-face-serum-30ml-amit';
    SELECT id INTO p_anarkali    FROM products WHERE slug='womens-anarkali-kurti-floral-kiran';

    -- Lookup order IDs via payment transaction_id (reliable across environments)
    SELECT o.id INTO o20 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-020-MEERA';
    SELECT o.id INTO o21 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-021-VIKRAM';
    SELECT o.id INTO o22 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-022-LAKSHMI';
    SELECT o.id INTO o23 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-023-ADITYA';
    SELECT o.id INTO o24 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-024-SNEHA';

    IF c_meera IS NULL OR o20 IS NULL THEN RETURN; END IF;

    -- Meera: Earbuds (5 stars)
    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_earbuds,c_meera,o20,5,'These earbuds are fantastic! The noise isolation is impressive even without ANC. I use them during my morning runs in Pune and the IPX5 rating keeps them safe from sweat. Battery lasts my entire work week. Best purchase in a long time!',TRUE,NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    -- Meera: Sunscreen (4 stars)
    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_sunscreen,c_meera,o20,4,'Lightweight sunscreen that does not feel greasy at all. Perfect for Pune summers. No white cast on my medium skin tone. Only giving 4 stars because the tube cap is a bit loose and can open in your bag.',TRUE,NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    -- Vikram: Dumbbells (5 stars)
    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_dumbbells,c_vikram,o21,5,'Excellent quality dumbbells! I set up a small home gym and these are perfect. The screw-lock mechanism is secure and the weight plates have a nice rubber coating. Delivery to Jaipur was quick too. Highly satisfied!',TRUE,NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    -- Vikram: Kurta (4 stars)
    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_kurta,c_vikram,o21,4,'Good cotton kurta for everyday wear. Fabric is soft and comfortable in Rajasthan heat. Colour is slightly different from the photo but still looks great. Stitching quality is good for the price.',TRUE,NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    -- Lakshmi: Lamp (5 stars)
    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_lamp,c_lakshmi,o22,5,'Perfect study lamp! I am a teacher and use this for evening lesson planning. The 5 brightness levels are very useful and warm white mode is easy on the eyes. USB port charges my phone while I work. Excellent value!',TRUE,NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    -- Aditya: Camera (4 stars)
    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_camera,c_aditya,o23,4,'Very good security camera for the price. Set it up in my Kolkata apartment entrance. Night vision is clear and motion alerts are timely. Two-way audio has a slight delay but works well enough. App could be more polished.',TRUE,NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    -- Aditya: Charger (5 stars)
    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_charger,c_aditya,o23,5,'This 65W GaN charger is incredibly compact! Charges my laptop and phone simultaneously. The foldable plug is great for travel. Build quality is premium and the braided cable included is a nice touch.',TRUE,NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    -- Sneha: Niacinamide (5 stars)
    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_niacinamide,c_sneha,o24,5,'This serum has completely transformed my skin! I had oily T-zone and visible pores. After just 2 weeks of use, my skin looks smoother and more balanced. No irritation at all. Already ordered a second bottle!',TRUE,NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    -- Sneha: Anarkali (4 stars)
    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_anarkali,c_sneha,o24,4,'Beautiful Anarkali kurti! The floral print is vibrant and the rayon fabric is very comfortable. I wore it to a family gathering and received many compliments. Slight colour bleed in first wash but fine after that.',TRUE,NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 7: DEMO RETURN/REFUND DATA (2 records)
-- ═══════════════════════════════════════════════════════════════
-- Return Request 1: Rohit returns Resistance Bands from DELIVERED Order 6
-- Return Request 2: Priya returns Oxford Shirt from DELIVERED Order 7
DO $$
DECLARE
    c_rohit BIGINT; c_priya BIGINT;
    o6 BIGINT; o7 BIGINT;
    p6 BIGINT; p7 BIGINT;
    oi_bands BIGINT; oi_shirt BIGINT;
    pay6 BIGINT; pay7 BIGINT;
    ret1 BIGINT; ret2 BIGINT;
BEGIN
    SELECT id INTO c_rohit FROM users WHERE email='rohit.verma@shopivo.demo';
    SELECT id INTO c_priya FROM users WHERE email='priya.nair@shopivo.demo';

    SELECT o.id INTO o6 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-006-ROHIT';
    SELECT o.id INTO o7 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-007-PRIYA';

    IF c_rohit IS NULL OR o6 IS NULL OR o7 IS NULL THEN RETURN; END IF;

    -- Idempotency check
    IF EXISTS (SELECT 1 FROM refunds WHERE refund_transaction_id = 'DEMO-REFUND-001-ROHIT') THEN RETURN; END IF;

    -- Get order_item IDs and payment IDs
    SELECT oi.id INTO oi_bands FROM order_items oi WHERE oi.order_id = o6 AND oi.product_name_snapshot LIKE '%Resistance Band%';
    SELECT oi.id INTO oi_shirt FROM order_items oi WHERE oi.order_id = o7 AND oi.product_name_snapshot LIKE '%Oxford%';
    SELECT id INTO pay6 FROM payments WHERE order_id = o6 AND payment_status = 'SUCCESS' LIMIT 1;
    SELECT id INTO pay7 FROM payments WHERE order_id = o7 AND payment_status = 'SUCCESS' LIMIT 1;

    IF oi_bands IS NULL OR oi_shirt IS NULL THEN RETURN; END IF;

    -- Return 1: Rohit - Bands (COMPLETED, refund COMPLETED)
    INSERT INTO return_requests(order_id,customer_id,order_item_id,reason,return_note,status,refund_amount,requested_at,approved_at,completed_at,created_at,updated_at)
    VALUES(o6,c_rohit,oi_bands,'PRODUCT_NOT_AS_EXPECTED','The resistance levels are not as described. The medium band feels the same as the light band.',
           'COMPLETED',899.00,NOW()-INTERVAL '30 days',NOW()-INTERVAL '28 days',NOW()-INTERVAL '26 days',NOW()-INTERVAL '30 days',NOW()-INTERVAL '26 days')
    RETURNING id INTO ret1;

    INSERT INTO refunds(return_id,order_id,customer_id,payment_id,refund_amount,refund_status,refund_transaction_id,payment_method,processed_at,created_at,updated_at)
    VALUES(ret1,o6,c_rohit,pay6,899.00,'COMPLETED','DEMO-REFUND-001-ROHIT','UPI',NOW()-INTERVAL '26 days',NOW()-INTERVAL '28 days',NOW()-INTERVAL '26 days');

    -- Return 2: Priya - Shirt (APPROVED, refund PENDING)
    INSERT INTO return_requests(order_id,customer_id,order_item_id,reason,return_note,status,refund_amount,requested_at,approved_at,created_at,updated_at)
    VALUES(o7,c_priya,oi_shirt,'SIZE_MISMATCH','Ordered size M but fits more like an S. Need to exchange or return.',
           'APPROVED',1199.00,NOW()-INTERVAL '5 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '5 days',NOW()-INTERVAL '3 days')
    RETURNING id INTO ret2;

    INSERT INTO refunds(return_id,order_id,customer_id,payment_id,refund_amount,refund_status,refund_transaction_id,payment_method,created_at,updated_at)
    VALUES(ret2,o7,c_priya,pay7,1199.00,'PENDING','DEMO-REFUND-002-PRIYA','CARD',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days');
END $$;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 8: VERIFICATION QUERIES (as comments — run manually)
-- ═══════════════════════════════════════════════════════════════
-- SELECT role, COUNT(*) AS total, COUNT(*) FILTER (WHERE enabled) AS active FROM users GROUP BY role ORDER BY role;
-- Expected: ADMIN=1(1), CUSTOMER=15(15), SELLER=9(8 active + 1 legacy V3)
--
-- SELECT status, COUNT(*) FROM products GROUP BY status ORDER BY status;
-- Expected: APPROVED=31, PENDING=8, REJECTED=5
--
-- SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY status;
-- Expected: CANCELLED=2, CONFIRMED=3, DELIVERED=13, PENDING=2, PROCESSING=2, SHIPPED=4
--
-- SELECT payment_status, COUNT(*) FROM payments GROUP BY payment_status;
-- Expected: INITIATED=2, REFUNDED=2, SUCCESS=22
--
-- SELECT COUNT(*) FROM reviews;
-- Expected: 23 (14 from V15 + 9 from V19)
--
-- SELECT COUNT(*) FROM addresses;
-- Expected: 15 (10 from V15 + 5 from V19)
--
-- SELECT COUNT(*) FROM return_requests;
-- Expected: 2
--
-- SELECT COUNT(*) FROM refunds;
-- Expected: 2
