-- ===========================================================================
-- V15__demo_seed_data.sql  --  DEVELOPMENT / DEMONSTRATION SEED DATA ONLY
-- ===========================================================================
-- Idempotent: ON CONFLICT DO NOTHING on all unique columns.
-- Customer pass: Shopivo@Demo2026! (BCrypt cost-12)
-- Seller pass:   Seller@Demo2026!  (BCrypt cost-12)
-- Admin: ONE admin (admin@shopivo.com) preserved. No new admins.
-- ===========================================================================

-- SECTION 1: CUSTOMER ACCOUNTS (10)
INSERT INTO users (email,password_hash,first_name,last_name,role,enabled,created_at,updated_at) VALUES
('ravi.kumar@shopivo.demo','$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y','Ravi','Kumar','CUSTOMER',TRUE,NOW()-INTERVAL '85 days',NOW()-INTERVAL '2 days'),
('sravani.reddy@shopivo.demo','$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y','Sravani','Reddy','CUSTOMER',TRUE,NOW()-INTERVAL '78 days',NOW()-INTERVAL '3 days'),
('harsha.vardhan@shopivo.demo','$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y','Harsha','Vardhan','CUSTOMER',TRUE,NOW()-INTERVAL '70 days',NOW()-INTERVAL '5 days'),
('keerthana.rao@shopivo.demo','$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y','Keerthana','Rao','CUSTOMER',TRUE,NOW()-INTERVAL '63 days',NOW()-INTERVAL '1 day'),
('anjali.sharma@shopivo.demo','$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y','Anjali','Sharma','CUSTOMER',TRUE,NOW()-INTERVAL '55 days',NOW()-INTERVAL '4 days'),
('rohit.verma@shopivo.demo','$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y','Rohit','Verma','CUSTOMER',TRUE,NOW()-INTERVAL '48 days',NOW()-INTERVAL '6 days'),
('priya.nair@shopivo.demo','$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y','Priya','Nair','CUSTOMER',TRUE,NOW()-INTERVAL '40 days',NOW()-INTERVAL '2 days'),
('arjun.mehta@shopivo.demo','$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y','Arjun','Mehta','CUSTOMER',TRUE,NOW()-INTERVAL '33 days',NOW()-INTERVAL '1 day'),
('naveen.krishna@shopivo.demo','$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y','Naveen','Krishna','CUSTOMER',TRUE,NOW()-INTERVAL '25 days',NOW()-INTERVAL '3 days'),
('divya.patel@shopivo.demo','$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y','Divya','Patel','CUSTOMER',TRUE,NOW()-INTERVAL '18 days',NOW()-INTERVAL '2 days')
ON CONFLICT (email) DO NOTHING;

-- SECTION 2: SELLER ACCOUNTS (8)
INSERT INTO users (email,password_hash,first_name,last_name,role,enabled,created_at,updated_at) VALUES
('raja.reddy@shopivo.demo','$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa','Raja','Reddy','SELLER',TRUE,NOW()-INTERVAL '120 days',NOW()-INTERVAL '5 days'),
('srinivas.rao@shopivo.demo','$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa','Srinivas','Rao','SELLER',TRUE,NOW()-INTERVAL '105 days',NOW()-INTERVAL '4 days'),
('kiran.kumar@shopivo.demo','$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa','Kiran','Kumar','SELLER',TRUE,NOW()-INTERVAL '92 days',NOW()-INTERVAL '3 days'),
('mahesh.rao@shopivo.demo','$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa','Mahesh','Rao','SELLER',TRUE,NOW()-INTERVAL '80 days',NOW()-INTERVAL '6 days'),
('pavan.reddy@shopivo.demo','$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa','Pavan','Reddy','SELLER',TRUE,NOW()-INTERVAL '68 days',NOW()-INTERVAL '2 days'),
('rahul.sharma@shopivo.demo','$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa','Rahul','Sharma','SELLER',TRUE,NOW()-INTERVAL '55 days',NOW()-INTERVAL '7 days'),
('amit.verma@shopivo.demo','$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa','Amit','Verma','SELLER',TRUE,NOW()-INTERVAL '42 days',NOW()-INTERVAL '3 days'),
('vivek.kumar@shopivo.demo','$2a$12$LbHAQwveJaBUAGVQiABzXue9Sos15J3TxZHDdmBV0mQ5JVb7pJYHa','Vivek','Kumar','SELLER',FALSE,NOW()-INTERVAL '30 days',NOW()-INTERVAL '10 days')
ON CONFLICT (email) DO NOTHING;

-- SECTION 3: CUSTOMER ADDRESSES
DO $$
DECLARE
    uid_ravi BIGINT; uid_sravani BIGINT; uid_harsha BIGINT; uid_keerthana BIGINT;
    uid_anjali BIGINT; uid_rohit BIGINT; uid_priya BIGINT; uid_arjun BIGINT;
    uid_naveen BIGINT; uid_divya BIGINT;
BEGIN
    SELECT id INTO uid_ravi      FROM users WHERE email='ravi.kumar@shopivo.demo';
    SELECT id INTO uid_sravani   FROM users WHERE email='sravani.reddy@shopivo.demo';
    SELECT id INTO uid_harsha    FROM users WHERE email='harsha.vardhan@shopivo.demo';
    SELECT id INTO uid_keerthana FROM users WHERE email='keerthana.rao@shopivo.demo';
    SELECT id INTO uid_anjali    FROM users WHERE email='anjali.sharma@shopivo.demo';
    SELECT id INTO uid_rohit     FROM users WHERE email='rohit.verma@shopivo.demo';
    SELECT id INTO uid_priya     FROM users WHERE email='priya.nair@shopivo.demo';
    SELECT id INTO uid_arjun     FROM users WHERE email='arjun.mehta@shopivo.demo';
    SELECT id INTO uid_naveen    FROM users WHERE email='naveen.krishna@shopivo.demo';
    SELECT id INTO uid_divya     FROM users WHERE email='divya.patel@shopivo.demo';
    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_ravi,'Home','Ravi Kumar','9876501001','14-2-45, Balaji Nagar','Tirupati','Andhra Pradesh','517501','India',TRUE
    WHERE uid_ravi IS NOT NULL AND NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_ravi AND label='Home');
    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_sravani,'Home','Sravani Reddy','9876502002','5-7, Jaganmohan Colony','Vijayawada','Andhra Pradesh','520010','India',TRUE
    WHERE uid_sravani IS NOT NULL AND NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_sravani AND label='Home');
    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_harsha,'Home','Harsha Vardhan','9876503003','8-1-22, KPHB Colony','Hyderabad','Telangana','500072','India',TRUE
    WHERE uid_harsha IS NOT NULL AND NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_harsha AND label='Home');
    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_keerthana,'Home','Keerthana Rao','9876504004','32, Seethammadhara Main Rd','Visakhapatnam','Andhra Pradesh','530013','India',TRUE
    WHERE uid_keerthana IS NOT NULL AND NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_keerthana AND label='Home');
    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_anjali,'Home','Anjali Sharma','9876505005','47, Indiranagar 100ft Road','Bengaluru','Karnataka','560038','India',TRUE
    WHERE uid_anjali IS NOT NULL AND NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_anjali AND label='Home');
    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_rohit,'Home','Rohit Verma','9876506006','B-204, Sector 62, NOIDA','Noida','Uttar Pradesh','201309','India',TRUE
    WHERE uid_rohit IS NOT NULL AND NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_rohit AND label='Home');
    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_priya,'Home','Priya Nair','9876507007','12, Anna Salai, T Nagar','Chennai','Tamil Nadu','600017','India',TRUE
    WHERE uid_priya IS NOT NULL AND NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_priya AND label='Home');
    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_arjun,'Home','Arjun Mehta','9876508008','301, Bandra West, Linking Rd','Mumbai','Maharashtra','400050','India',TRUE
    WHERE uid_arjun IS NOT NULL AND NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_arjun AND label='Home');
    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_naveen,'Home','Naveen Krishna','9876509009','77-A, Gomti Nagar','Lucknow','Uttar Pradesh','226010','India',TRUE
    WHERE uid_naveen IS NOT NULL AND NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_naveen AND label='Home');
    INSERT INTO addresses(user_id,label,full_name,phone,line1,city,state,postal_code,country,is_default)
    SELECT uid_divya,'Home','Divya Patel','9876510010','22, Vastrapur Lake Road','Ahmedabad','Gujarat','380054','India',TRUE
    WHERE uid_divya IS NOT NULL AND NOT EXISTS(SELECT 1 FROM addresses WHERE user_id=uid_divya AND label='Home');
END $$;

-- SECTION 4: PRODUCTS (34 total, APPROVED/PENDING/REJECTED mix)
DO $$
DECLARE
    s_raja BIGINT; s_srinivas BIGINT; s_kiran BIGINT; s_mahesh BIGINT;
    s_pavan BIGINT; s_rahul BIGINT; s_amit BIGINT; s_vivek BIGINT;
    cat_elec BIGINT; cat_cloth BIGINT; cat_books BIGINT;
    cat_home BIGINT; cat_sports BIGINT; cat_beauty BIGINT;
BEGIN
    SELECT id INTO s_raja     FROM users WHERE email='raja.reddy@shopivo.demo';
    SELECT id INTO s_srinivas FROM users WHERE email='srinivas.rao@shopivo.demo';
    SELECT id INTO s_kiran    FROM users WHERE email='kiran.kumar@shopivo.demo';
    SELECT id INTO s_mahesh   FROM users WHERE email='mahesh.rao@shopivo.demo';
    SELECT id INTO s_pavan    FROM users WHERE email='pavan.reddy@shopivo.demo';
    SELECT id INTO s_rahul    FROM users WHERE email='rahul.sharma@shopivo.demo';
    SELECT id INTO s_amit     FROM users WHERE email='amit.verma@shopivo.demo';
    SELECT id INTO s_vivek    FROM users WHERE email='vivek.kumar@shopivo.demo';
    SELECT id INTO cat_elec   FROM categories WHERE slug='electronics';
    SELECT id INTO cat_cloth  FROM categories WHERE slug='clothing';
    SELECT id INTO cat_books  FROM categories WHERE slug='books';
    SELECT id INTO cat_home   FROM categories WHERE slug='home-kitchen';
    SELECT id INTO cat_sports FROM categories WHERE slug='sports-outdoors';
    SELECT id INTO cat_beauty FROM categories WHERE slug='beauty-care';

    -- Raja Reddy (Electronics): 3 APPROVED 1 PENDING 1 REJECTED
    INSERT INTO products(seller_id,category_id,name,slug,description,price,stock_quantity,image_url,status,rejection_reason,created_at,updated_at) VALUES
    (s_raja,cat_elec,'True Wireless Earbuds Pro','true-wireless-earbuds-pro-raja',
     '6mm drivers, 28-hour battery with case, IPX5, touch controls, dual mics.',
     2499.00,120,'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400','APPROVED',NULL,NOW()-INTERVAL '110 days',NOW()-INTERVAL '90 days'),
    (s_raja,cat_elec,'Portable Bluetooth Speaker 20W','portable-bluetooth-speaker-20w-raja',
     'Compact 20W 360-degree sound, 12-hour playtime, IPX7 waterproof, built-in mic.',
     3299.00,85,'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400','APPROVED',NULL,NOW()-INTERVAL '108 days',NOW()-INTERVAL '88 days'),
    (s_raja,cat_elec,'USB-C 65W GaN Fast Charger','usb-c-65w-gan-fast-charger-raja',
     '65W GaN, foldable plug, worldwide voltage, 1.8m braided cable included.',
     1699.00,200,'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400','APPROVED',NULL,NOW()-INTERVAL '105 days',NOW()-INTERVAL '85 days'),
    (s_raja,cat_elec,'4K Webcam with Ring Light','4k-webcam-ring-light-raja',
     '4K autofocus webcam with dual mic and adjustable ring light. Plug-and-play USB.',
     4799.00,45,'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400','PENDING',NULL,NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days'),
    (s_raja,cat_elec,'RGB Gaming Mouse 16000 DPI','rgb-gaming-mouse-16000-dpi-raja',
     'High-performance gaming mouse',
     1999.00,60,NULL,'REJECTED','Product description is incomplete. Please provide full specifications including sensor type, button count, cable length, and weight.',
     NOW()-INTERVAL '50 days',NOW()-INTERVAL '45 days')
    ON CONFLICT (slug) DO NOTHING;

    -- Srinivas Rao (Home & Kitchen): 2 APPROVED 2 PENDING 1 REJECTED
    INSERT INTO products(seller_id,category_id,name,slug,description,price,stock_quantity,image_url,status,rejection_reason,created_at,updated_at) VALUES
    (s_srinivas,cat_home,'Stainless Steel Cookware Set 5-Piece','stainless-steel-cookware-set-5pc-srinivas',
     'Premium 5-piece stainless steel cookware. Induction compatible, dishwasher safe.',
     4299.00,55,'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400','APPROVED',NULL,NOW()-INTERVAL '97 days',NOW()-INTERVAL '75 days'),
    (s_srinivas,cat_home,'LED Desk Lamp with USB Charging Port','led-desk-lamp-usb-charging-srinivas',
     'Adjustable LED lamp, 5 brightness levels, 3 colour temps, touch control, USB-A port.',
     1299.00,140,'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400','APPROVED',NULL,NOW()-INTERVAL '95 days',NOW()-INTERVAL '73 days'),
    (s_srinivas,cat_home,'Bamboo Kitchen Storage Organiser Set','bamboo-kitchen-organiser-set-srinivas',
     '6 bamboo organiser boxes with removable dividers. Eco-friendly sustainable bamboo.',
     999.00,180,'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400','PENDING',NULL,NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days'),
    (s_srinivas,cat_home,'Premium Cotton Bedsheet Set King','premium-cotton-bedsheet-king-srinivas',
     '400TC 100% cotton king bedsheet set with 2 pillow covers. 8 colour options.',
     2199.00,75,'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400','PENDING',NULL,NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days'),
    (s_srinivas,cat_home,'Glass Water Bottle 1L with Sleeve','glass-water-bottle-1l-sleeve-srinivas',
     'Glass bottle kitchen item',
     650.00,90,NULL,'REJECTED','Product image does not meet catalogue requirements. Please upload a clear photograph on white background at min 800x800 px.',
     NOW()-INTERVAL '60 days',NOW()-INTERVAL '55 days')
    ON CONFLICT (slug) DO NOTHING;

    -- Kiran Kumar (Clothing): 3 APPROVED 1 PENDING 1 REJECTED
    INSERT INTO products(seller_id,category_id,name,slug,description,price,stock_quantity,image_url,status,rejection_reason,created_at,updated_at) VALUES
    (s_kiran,cat_cloth,'Mens Regular Fit Casual Kurta','mens-regular-fit-casual-kurta-kiran',
     'Everyday cotton kurta, machine washable, sizes S-XXL, 10 colour options.',
     899.00,250,'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400','APPROVED',NULL,NOW()-INTERVAL '84 days',NOW()-INTERVAL '60 days'),
    (s_kiran,cat_cloth,'Womens Anarkali Kurti Floral Print','womens-anarkali-kurti-floral-kiran',
     'Floral Anarkali kurti in soft rayon, 3/4 sleeves, side slits. Sizes XS-3XL.',
     1399.00,130,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400','APPROVED',NULL,NOW()-INTERVAL '82 days',NOW()-INTERVAL '58 days'),
    (s_kiran,cat_cloth,'Mens Running Shoes Lightweight','mens-running-shoes-lightweight-kiran',
     'Ultra-light mesh shoes, cushioned EVA sole, anti-slip rubber outsole. Sizes 6-12.',
     2299.00,95,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400','APPROVED',NULL,NOW()-INTERVAL '80 days',NOW()-INTERVAL '55 days'),
    (s_kiran,cat_cloth,'Womens Casual Denim Jacket','womens-casual-denim-jacket-kiran',
     'Button-front denim jacket with chest pockets and adjustable cuffs. Sizes XS-XL.',
     1799.00,70,'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400','PENDING',NULL,NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days'),
    (s_kiran,cat_cloth,'Sports Track Pants','sports-track-pants-kiran',
     'Track pants for daily use',
     799.00,100,NULL,'REJECTED','Required product specifications are missing. Please include fabric composition, care instructions, available sizes, and product images.',
     NOW()-INTERVAL '40 days',NOW()-INTERVAL '35 days')
    ON CONFLICT (slug) DO NOTHING;

    -- Mahesh Rao (Electronics): 3 APPROVED 2 PENDING
    INSERT INTO products(seller_id,category_id,name,slug,description,price,stock_quantity,image_url,status,rejection_reason,created_at,updated_at) VALUES
    (s_mahesh,cat_elec,'Smart Home Security Camera 1080p','smart-home-security-camera-1080p-mahesh',
     '1080P Full HD indoor cam, two-way audio, 10m night vision, motion alerts, 7-day cloud storage.',
     2899.00,65,'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400','APPROVED',NULL,NOW()-INTERVAL '72 days',NOW()-INTERVAL '50 days'),
    (s_mahesh,cat_elec,'Laptop Stand Adjustable Aluminium','laptop-stand-adjustable-aluminium-mahesh',
     'Ergonomic aluminium stand, 10-17.3 inch compatible, 6 height adjustments, foldable.',
     1899.00,110,'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400','APPROVED',NULL,NOW()-INTERVAL '70 days',NOW()-INTERVAL '48 days'),
    (s_mahesh,cat_elec,'Wireless Charging Pad 15W','wireless-charging-pad-15w-mahesh',
     '15W Qi-certified, charges through cases up to 5mm, LED indicator, anti-slip base.',
     1199.00,155,'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=400','APPROVED',NULL,NOW()-INTERVAL '68 days',NOW()-INTERVAL '46 days'),
    (s_mahesh,cat_elec,'Smart LED Bulbs Pack of 4','smart-led-bulbs-pack-4-mahesh',
     'Wi-Fi 9W bulbs, 16M colours, Alexa/Google compatible, no hub required.',
     2499.00,80,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400','PENDING',NULL,NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days'),
    (s_mahesh,cat_elec,'Mini Projector 720p Portable','mini-projector-720p-portable-mahesh',
     '120-inch projection, built-in speaker, HDMI and USB inputs, 45000h lamp life.',
     8999.00,25,'https://images.unsplash.com/photo-1583394293214-0571b07a0bca?w=400','PENDING',NULL,NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days')
    ON CONFLICT (slug) DO NOTHING;

    -- Pavan Reddy (Sports): 3 APPROVED 1 PENDING
    INSERT INTO products(seller_id,category_id,name,slug,description,price,stock_quantity,image_url,status,rejection_reason,created_at,updated_at) VALUES
    (s_pavan,cat_sports,'Resistance Band Set 5-Levels','resistance-band-set-5-levels-pavan',
     '5 colour-coded natural latex bands, 200% stretch, carry bag included.',
     899.00,300,'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400','APPROVED',NULL,NOW()-INTERVAL '60 days',NOW()-INTERVAL '40 days'),
    (s_pavan,cat_sports,'Adjustable Dumbbell Set 10kg','adjustable-dumbbell-set-10kg-pavan',
     'Pair of 2-10kg dumbbells with screw collars, storage tray, exercise guide.',
     4599.00,40,'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400','APPROVED',NULL,NOW()-INTERVAL '58 days',NOW()-INTERVAL '38 days'),
    (s_pavan,cat_sports,'Jump Rope Speed Cable Skipping','jump-rope-speed-cable-skipping-pavan',
     'Aluminium handles, 3mm steel PVC cable, 360 ball bearing, adjustable up to 3m.',
     549.00,400,'https://images.unsplash.com/photo-1509563268479-0f004cf3f58b?w=400','APPROVED',NULL,NOW()-INTERVAL '56 days',NOW()-INTERVAL '36 days'),
    (s_pavan,cat_sports,'Camping Trekking Backpack 50L','camping-trekking-backpack-50l-pavan',
     '50L with rain cover, aluminium frame, padded straps, hydration bladder sleeve.',
     5499.00,30,'https://images.unsplash.com/photo-1547496502-affa22d38842?w=400','PENDING',NULL,NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days')
    ON CONFLICT (slug) DO NOTHING;

    -- Rahul Sharma (Clothing): 2 APPROVED 1 PENDING 1 REJECTED
    INSERT INTO products(seller_id,category_id,name,slug,description,price,stock_quantity,image_url,status,rejection_reason,created_at,updated_at) VALUES
    (s_rahul,cat_cloth,'Mens Oxford Formal Shirt','mens-oxford-formal-shirt-rahul',
     '100% Egyptian cotton Oxford weave, button-down collar. White/blue/grey. Sizes S-3XL.',
     1199.00,175,'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400','APPROVED',NULL,NOW()-INTERVAL '48 days',NOW()-INTERVAL '28 days'),
    (s_rahul,cat_cloth,'Womens Palazzo Pants Set','womens-palazzo-pants-set-rahul',
     'Georgette palazzo set with matching crop top, elasticated waist. Sizes S-XXL.',
     1599.00,110,'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400','APPROVED',NULL,NOW()-INTERVAL '46 days',NOW()-INTERVAL '26 days'),
    (s_rahul,cat_cloth,'Woollen Shawl Handwoven Kashmiri','woollen-shawl-handwoven-kashmiri-rahul',
     'Handwoven pure wool shawl, traditional embroidery, 200x70cm, authenticity certificate.',
     3499.00,50,'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400','PENDING',NULL,NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days'),
    (s_rahul,cat_cloth,'Gym Tank Top Dryfit','gym-tank-top-dryfit-rahul',
     'Gym wear',
     399.00,200,NULL,'REJECTED','Product title does not clearly describe the item. Include material type, gender, and key feature in the title.',
     NOW()-INTERVAL '35 days',NOW()-INTERVAL '30 days')
    ON CONFLICT (slug) DO NOTHING;

    -- Amit Verma (Beauty): 3 APPROVED 1 PENDING
    INSERT INTO products(seller_id,category_id,name,slug,description,price,stock_quantity,image_url,status,rejection_reason,created_at,updated_at) VALUES
    (s_amit,cat_beauty,'Niacinamide 10 Percent Face Serum 30ml','niacinamide-10-face-serum-30ml-amit',
     '10% Niacinamide + 1% Zinc serum. Minimises pores, balances sebum, evens skin tone. Fragrance-free.',
     599.00,320,'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400','APPROVED',NULL,NOW()-INTERVAL '35 days',NOW()-INTERVAL '15 days'),
    (s_amit,cat_beauty,'Beard Grooming Kit 7-in-1','beard-grooming-kit-7-in-1-amit',
     'Kit: beard oil 30ml, balm 50g, wooden comb, brush, scissors, trimmer, travel pouch.',
     1899.00,95,'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400','APPROVED',NULL,NOW()-INTERVAL '33 days',NOW()-INTERVAL '13 days'),
    (s_amit,cat_beauty,'Sunscreen SPF 50 PA Plus 100ml','sunscreen-spf50-pa-plus-100ml-amit',
     'SPF 50 PA+++ mineral sunscreen, no white cast, reef-safe, sensitive skin safe.',
     449.00,450,'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400','APPROVED',NULL,NOW()-INTERVAL '31 days',NOW()-INTERVAL '11 days'),
    (s_amit,cat_beauty,'Retinol Anti-Ageing Night Cream','retinol-anti-ageing-night-cream-amit',
     '0.3% encapsulated retinol with peptides and hyaluronic acid. Reduces fine lines overnight.',
     1299.00,75,'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400','PENDING',NULL,NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days')
    ON CONFLICT (slug) DO NOTHING;

    -- Vivek Kumar (Books, suspended seller): 3 APPROVED
    INSERT INTO products(seller_id,category_id,name,slug,description,price,stock_quantity,image_url,status,rejection_reason,created_at,updated_at) VALUES
    (s_vivek,cat_books,'The Alchemist Paulo Coelho','the-alchemist-paulo-coelho-vivek',
     'Philosophical novel about a shepherd seeking treasure. 65M+ copies sold. Paperback.',
     299.00,500,'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400','APPROVED',NULL,NOW()-INTERVAL '28 days',NOW()-INTERVAL '28 days'),
    (s_vivek,cat_books,'Atomic Habits James Clear','atomic-habits-james-clear-vivek',
     'Build good habits and break bad ones. No.1 NYT bestseller. Paperback edition.',
     499.00,350,'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400','APPROVED',NULL,NOW()-INTERVAL '26 days',NOW()-INTERVAL '26 days'),
    (s_vivek,cat_books,'Deep Work Cal Newport','deep-work-cal-newport-vivek',
     'Rules for focused success in a distracted world. Practical deep focus guide. Paperback.',
     449.00,280,'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400','APPROVED',NULL,NOW()-INTERVAL '24 days',NOW()-INTERVAL '24 days')
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- SECTION 5: DEMO ORDERS (19 total: DELIVERED x8, SHIPPED x3, PROCESSING x2, CONFIRMED x2, PENDING x2, CANCELLED x2)
DO $$
DECLARE
    c_ravi BIGINT; c_sravani BIGINT; c_harsha BIGINT; c_keerthana BIGINT;
    c_anjali BIGINT; c_rohit BIGINT; c_priya BIGINT; c_arjun BIGINT;
    c_naveen BIGINT; c_divya BIGINT;
    p_earbuds BIGINT; p_speaker BIGINT; p_charger BIGINT;
    p_cookware BIGINT; p_lamp BIGINT;
    p_kurta BIGINT; p_anarkali BIGINT; p_shoes BIGINT;
    p_camera BIGINT; p_stand BIGINT; p_chargepad BIGINT;
    p_bands BIGINT; p_dumbbells BIGINT; p_jumprope BIGINT;
    p_shirt BIGINT; p_palazzo BIGINT;
    p_niacinamide BIGINT; p_beard BIGINT; p_sunscreen BIGINT;
    p_alchemist BIGINT; p_atomic BIGINT;
    s_raja BIGINT; s_srinivas BIGINT; s_kiran BIGINT;
    s_mahesh BIGINT; s_pavan BIGINT; s_rahul BIGINT;
    s_amit BIGINT; s_vivek BIGINT;
    o1 BIGINT; o2 BIGINT; o3 BIGINT; o4 BIGINT; o5 BIGINT;
    o6 BIGINT; o7 BIGINT; o8 BIGINT; o9 BIGINT; o10 BIGINT;
    o11 BIGINT; o12 BIGINT; o13 BIGINT; o14 BIGINT; o15 BIGINT;
    o16 BIGINT; o17 BIGINT; o18 BIGINT; o19 BIGINT;
BEGIN
    SELECT id INTO c_ravi      FROM users WHERE email='ravi.kumar@shopivo.demo';
    SELECT id INTO c_sravani   FROM users WHERE email='sravani.reddy@shopivo.demo';
    SELECT id INTO c_harsha    FROM users WHERE email='harsha.vardhan@shopivo.demo';
    SELECT id INTO c_keerthana FROM users WHERE email='keerthana.rao@shopivo.demo';
    SELECT id INTO c_anjali    FROM users WHERE email='anjali.sharma@shopivo.demo';
    SELECT id INTO c_rohit     FROM users WHERE email='rohit.verma@shopivo.demo';
    SELECT id INTO c_priya     FROM users WHERE email='priya.nair@shopivo.demo';
    SELECT id INTO c_arjun     FROM users WHERE email='arjun.mehta@shopivo.demo';
    SELECT id INTO c_naveen    FROM users WHERE email='naveen.krishna@shopivo.demo';
    SELECT id INTO c_divya     FROM users WHERE email='divya.patel@shopivo.demo';
    SELECT id INTO s_raja     FROM users WHERE email='raja.reddy@shopivo.demo';
    SELECT id INTO s_srinivas FROM users WHERE email='srinivas.rao@shopivo.demo';
    SELECT id INTO s_kiran    FROM users WHERE email='kiran.kumar@shopivo.demo';
    SELECT id INTO s_mahesh   FROM users WHERE email='mahesh.rao@shopivo.demo';
    SELECT id INTO s_pavan    FROM users WHERE email='pavan.reddy@shopivo.demo';
    SELECT id INTO s_rahul    FROM users WHERE email='rahul.sharma@shopivo.demo';
    SELECT id INTO s_amit     FROM users WHERE email='amit.verma@shopivo.demo';
    SELECT id INTO s_vivek    FROM users WHERE email='vivek.kumar@shopivo.demo';
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
    IF c_ravi IS NULL OR p_earbuds IS NULL THEN RETURN; END IF;
    -- Idempotency check: exit if demo orders already exist
    IF EXISTS (SELECT 1 FROM payments WHERE transaction_id = 'DEMO-TXN-001-RAVI') THEN RETURN; END IF;

    -- DELIVERED ORDER 1: Ravi - Earbuds + Speaker
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_ravi,'Ravi Kumar','9876501001','14-2-45, Balaji Nagar','Tirupati','Andhra Pradesh','517501','India','DELIVERED',5798.00,5798.00,0.00,NOW()-INTERVAL '75 days',NOW()-INTERVAL '70 days') RETURNING id INTO o1;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o1,p_earbuds,s_raja,'True Wireless Earbuds Pro',2499.00,1,2499.00,NOW()-INTERVAL '75 days'),
    (o1,p_speaker,s_raja,'Portable Bluetooth Speaker 20W',3299.00,1,3299.00,NOW()-INTERVAL '75 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o1,c_ravi,'CARD','SUCCESS','DEMO-TXN-001-RAVI',5798.00,'SANDBOX_SECUREPAY','4242',NOW()-INTERVAL '75 days',NOW()-INTERVAL '75 days');

    -- DELIVERED ORDER 2: Sravani - Cookware + Lamp
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_sravani,'Sravani Reddy','9876502002','5-7, Jaganmohan Colony','Vijayawada','Andhra Pradesh','520010','India','DELIVERED',5598.00,5598.00,0.00,NOW()-INTERVAL '72 days',NOW()-INTERVAL '67 days') RETURNING id INTO o2;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o2,p_cookware,s_srinivas,'Stainless Steel Cookware Set 5-Piece',4299.00,1,4299.00,NOW()-INTERVAL '72 days'),
    (o2,p_lamp,s_srinivas,'LED Desk Lamp with USB Charging Port',1299.00,1,1299.00,NOW()-INTERVAL '72 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o2,c_sravani,'UPI','SUCCESS','DEMO-TXN-002-SRAVANI',5598.00,'SANDBOX_SECUREPAY','sravani@upi',NOW()-INTERVAL '72 days',NOW()-INTERVAL '72 days');

    -- DELIVERED ORDER 3: Harsha - Kurta + Shoes
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_harsha,'Harsha Vardhan','9876503003','8-1-22, KPHB Colony','Hyderabad','Telangana','500072','India','DELIVERED',3198.00,3198.00,0.00,NOW()-INTERVAL '65 days',NOW()-INTERVAL '60 days') RETURNING id INTO o3;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o3,p_kurta,s_kiran,'Mens Regular Fit Casual Kurta',899.00,1,899.00,NOW()-INTERVAL '65 days'),
    (o3,p_shoes,s_kiran,'Mens Running Shoes Lightweight',2299.00,1,2299.00,NOW()-INTERVAL '65 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o3,c_harsha,'CARD','SUCCESS','DEMO-TXN-003-HARSHA',3198.00,'SANDBOX_SECUREPAY','5678',NOW()-INTERVAL '65 days',NOW()-INTERVAL '65 days');

    -- DELIVERED ORDER 4: Keerthana - Camera
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_keerthana,'Keerthana Rao','9876504004','32, Seethammadhara Main Rd','Visakhapatnam','Andhra Pradesh','530013','India','DELIVERED',2899.00,2899.00,0.00,NOW()-INTERVAL '58 days',NOW()-INTERVAL '53 days') RETURNING id INTO o4;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o4,p_camera,s_mahesh,'Smart Home Security Camera 1080p',2899.00,1,2899.00,NOW()-INTERVAL '58 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o4,c_keerthana,'UPI','SUCCESS','DEMO-TXN-004-KEERTHANA',2899.00,'SANDBOX_SECUREPAY','keerthana@upi',NOW()-INTERVAL '58 days',NOW()-INTERVAL '58 days');

    -- DELIVERED ORDER 5: Anjali - Beauty + Fashion (4 items)
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_anjali,'Anjali Sharma','9876505005','47, Indiranagar 100ft Road','Bengaluru','Karnataka','560038','India','DELIVERED',3597.00,3597.00,0.00,NOW()-INTERVAL '50 days',NOW()-INTERVAL '45 days') RETURNING id INTO o5;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o5,p_niacinamide,s_amit,'Niacinamide 10 Percent Face Serum 30ml',599.00,1,599.00,NOW()-INTERVAL '50 days'),
    (o5,p_sunscreen,s_amit,'Sunscreen SPF 50 PA Plus 100ml',449.00,1,449.00,NOW()-INTERVAL '50 days'),
    (o5,p_anarkali,s_kiran,'Womens Anarkali Kurti Floral Print',1399.00,1,1399.00,NOW()-INTERVAL '50 days'),
    (o5,p_palazzo,s_rahul,'Womens Palazzo Pants Set',1150.00,1,1150.00,NOW()-INTERVAL '50 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o5,c_anjali,'CARD','SUCCESS','DEMO-TXN-005-ANJALI',3597.00,'SANDBOX_SECUREPAY','9999',NOW()-INTERVAL '50 days',NOW()-INTERVAL '50 days');

    -- DELIVERED ORDER 6: Rohit - Dumbbells + Bands
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_rohit,'Rohit Verma','9876506006','B-204, Sector 62, NOIDA','Noida','Uttar Pradesh','201309','India','DELIVERED',5498.00,5498.00,0.00,NOW()-INTERVAL '42 days',NOW()-INTERVAL '37 days') RETURNING id INTO o6;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o6,p_dumbbells,s_pavan,'Adjustable Dumbbell Set 10kg',4599.00,1,4599.00,NOW()-INTERVAL '42 days'),
    (o6,p_bands,s_pavan,'Resistance Band Set 5-Levels',899.00,1,899.00,NOW()-INTERVAL '42 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o6,c_rohit,'UPI','SUCCESS','DEMO-TXN-006-ROHIT',5498.00,'SANDBOX_SECUREPAY','rohit@upi',NOW()-INTERVAL '42 days',NOW()-INTERVAL '42 days');

    -- DELIVERED ORDER 7: Priya - Shirt + Charger
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_priya,'Priya Nair','9876507007','12, Anna Salai, T Nagar','Chennai','Tamil Nadu','600017','India','DELIVERED',2898.00,2898.00,0.00,NOW()-INTERVAL '35 days',NOW()-INTERVAL '30 days') RETURNING id INTO o7;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o7,p_shirt,s_rahul,'Mens Oxford Formal Shirt',1199.00,1,1199.00,NOW()-INTERVAL '35 days'),
    (o7,p_charger,s_raja,'USB-C 65W GaN Fast Charger',1699.00,1,1699.00,NOW()-INTERVAL '35 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o7,c_priya,'CARD','SUCCESS','DEMO-TXN-007-PRIYA',2898.00,'SANDBOX_SECUREPAY','1111',NOW()-INTERVAL '35 days',NOW()-INTERVAL '35 days');

    -- DELIVERED ORDER 8: Arjun - Books (Alchemist x1, Atomic Habits x2)
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_arjun,'Arjun Mehta','9876508008','301, Bandra West, Linking Rd','Mumbai','Maharashtra','400050','India','DELIVERED',1247.00,1247.00,0.00,NOW()-INTERVAL '28 days',NOW()-INTERVAL '23 days') RETURNING id INTO o8;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o8,p_alchemist,s_vivek,'The Alchemist Paulo Coelho',299.00,1,299.00,NOW()-INTERVAL '28 days'),
    (o8,p_atomic,s_vivek,'Atomic Habits James Clear',499.00,2,998.00,NOW()-INTERVAL '28 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o8,c_arjun,'UPI','SUCCESS','DEMO-TXN-008-ARJUN',1247.00,'SANDBOX_SECUREPAY','arjun@upi',NOW()-INTERVAL '28 days',NOW()-INTERVAL '28 days');

    -- SHIPPED ORDER 9: Naveen - Stand + Chargepad
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_naveen,'Naveen Krishna','9876509009','77-A, Gomti Nagar','Lucknow','Uttar Pradesh','226010','India','SHIPPED',3098.00,3098.00,0.00,NOW()-INTERVAL '10 days',NOW()-INTERVAL '7 days') RETURNING id INTO o9;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o9,p_stand,s_mahesh,'Laptop Stand Adjustable Aluminium',1899.00,1,1899.00,NOW()-INTERVAL '10 days'),
    (o9,p_chargepad,s_mahesh,'Wireless Charging Pad 15W',1199.00,1,1199.00,NOW()-INTERVAL '10 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o9,c_naveen,'CARD','SUCCESS','DEMO-TXN-009-NAVEEN',3098.00,'SANDBOX_SECUREPAY','3456',NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days');

    -- SHIPPED ORDER 10: Divya - Beard Kit + Palazzo
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_divya,'Divya Patel','9876510010','22, Vastrapur Lake Road','Ahmedabad','Gujarat','380054','India','SHIPPED',3498.00,3498.00,0.00,NOW()-INTERVAL '8 days',NOW()-INTERVAL '5 days') RETURNING id INTO o10;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o10,p_beard,s_amit,'Beard Grooming Kit 7-in-1',1899.00,1,1899.00,NOW()-INTERVAL '8 days'),
    (o10,p_palazzo,s_rahul,'Womens Palazzo Pants Set',1599.00,1,1599.00,NOW()-INTERVAL '8 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o10,c_divya,'UPI','SUCCESS','DEMO-TXN-010-DIVYA',3498.00,'SANDBOX_SECUREPAY','divya@upi',NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days');

    -- SHIPPED ORDER 11: Ravi - JumpRope + Bands
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_ravi,'Ravi Kumar','9876501001','14-2-45, Balaji Nagar','Tirupati','Andhra Pradesh','517501','India','SHIPPED',1448.00,1448.00,0.00,NOW()-INTERVAL '7 days',NOW()-INTERVAL '5 days') RETURNING id INTO o11;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o11,p_jumprope,s_pavan,'Jump Rope Speed Cable Skipping',549.00,1,549.00,NOW()-INTERVAL '7 days'),
    (o11,p_bands,s_pavan,'Resistance Band Set 5-Levels',899.00,1,899.00,NOW()-INTERVAL '7 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o11,c_ravi,'CARD','SUCCESS','DEMO-TXN-011-RAVI2',1448.00,'SANDBOX_SECUREPAY','4242',NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days');

    -- PROCESSING ORDER 12: Harsha - Shirt
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_harsha,'Harsha Vardhan','9876503003','8-1-22, KPHB Colony','Hyderabad','Telangana','500072','India','PROCESSING',1199.00,1199.00,0.00,NOW()-INTERVAL '4 days',NOW()-INTERVAL '3 days') RETURNING id INTO o12;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o12,p_shirt,s_rahul,'Mens Oxford Formal Shirt',1199.00,1,1199.00,NOW()-INTERVAL '4 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o12,c_harsha,'CARD','SUCCESS','DEMO-TXN-012-HARSHA2',1199.00,'SANDBOX_SECUREPAY','5678',NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days');

    -- PROCESSING ORDER 13: Sravani - Sunscreen x2
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_sravani,'Sravani Reddy','9876502002','5-7, Jaganmohan Colony','Vijayawada','Andhra Pradesh','520010','India','PROCESSING',898.00,898.00,0.00,NOW()-INTERVAL '3 days',NOW()-INTERVAL '2 days') RETURNING id INTO o13;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o13,p_sunscreen,s_amit,'Sunscreen SPF 50 PA Plus 100ml',449.00,2,898.00,NOW()-INTERVAL '3 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o13,c_sravani,'UPI','SUCCESS','DEMO-TXN-013-SRAVANI2',898.00,'SANDBOX_SECUREPAY','sravani@upi',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days');

    -- CONFIRMED ORDER 14: Anjali - Earbuds + Kurta
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_anjali,'Anjali Sharma','9876505005','47, Indiranagar 100ft Road','Bengaluru','Karnataka','560038','India','CONFIRMED',3398.00,3398.00,0.00,NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day') RETURNING id INTO o14;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o14,p_earbuds,s_raja,'True Wireless Earbuds Pro',2499.00,1,2499.00,NOW()-INTERVAL '2 days'),
    (o14,p_kurta,s_kiran,'Mens Regular Fit Casual Kurta',899.00,1,899.00,NOW()-INTERVAL '2 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o14,c_anjali,'CARD','SUCCESS','DEMO-TXN-014-ANJALI2',3398.00,'SANDBOX_SECUREPAY','9999',NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days');

    -- CONFIRMED ORDER 15: Priya - Niacinamide + Beard Kit
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_priya,'Priya Nair','9876507007','12, Anna Salai, T Nagar','Chennai','Tamil Nadu','600017','India','CONFIRMED',2498.00,2498.00,0.00,NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day') RETURNING id INTO o15;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o15,p_niacinamide,s_amit,'Niacinamide 10 Percent Face Serum 30ml',599.00,1,599.00,NOW()-INTERVAL '2 days'),
    (o15,p_beard,s_amit,'Beard Grooming Kit 7-in-1',1899.00,1,1899.00,NOW()-INTERVAL '2 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o15,c_priya,'UPI','SUCCESS','DEMO-TXN-015-PRIYA2',2498.00,'SANDBOX_SECUREPAY','priya@upi',NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days');

    -- PENDING ORDER 16: Naveen - Speaker
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_naveen,'Naveen Krishna','9876509009','77-A, Gomti Nagar','Lucknow','Uttar Pradesh','226010','India','PENDING',3299.00,3299.00,0.00,NOW()-INTERVAL '1 day',NOW()-INTERVAL '1 day') RETURNING id INTO o16;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o16,p_speaker,s_raja,'Portable Bluetooth Speaker 20W',3299.00,1,3299.00,NOW()-INTERVAL '1 day');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o16,c_naveen,'CARD','INITIATED','DEMO-TXN-016-NAVEEN2',3299.00,'SANDBOX_SECUREPAY','3456',NOW()-INTERVAL '1 day',NOW()-INTERVAL '1 day');

    -- PENDING ORDER 17: Divya - Charger
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,created_at,updated_at)
    VALUES(c_divya,'Divya Patel','9876510010','22, Vastrapur Lake Road','Ahmedabad','Gujarat','380054','India','PENDING',1699.00,1699.00,0.00,NOW()-INTERVAL '12 hours',NOW()-INTERVAL '12 hours') RETURNING id INTO o17;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o17,p_charger,s_raja,'USB-C 65W GaN Fast Charger',1699.00,1,1699.00,NOW()-INTERVAL '12 hours');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o17,c_divya,'UPI','INITIATED','DEMO-TXN-017-DIVYA2',1699.00,'SANDBOX_SECUREPAY','divya@upi',NOW()-INTERVAL '12 hours',NOW()-INTERVAL '12 hours');

    -- CANCELLED ORDER 18: Rohit - Charger (better price elsewhere)
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,cancellation_reason,cancelled_at,created_at,updated_at)
    VALUES(c_rohit,'Rohit Verma','9876506006','B-204, Sector 62, NOIDA','Noida','Uttar Pradesh','201309','India','CANCELLED',1699.00,1699.00,0.00,'Found a better price on another platform',NOW()-INTERVAL '18 days',NOW()-INTERVAL '20 days',NOW()-INTERVAL '18 days') RETURNING id INTO o18;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o18,p_charger,s_raja,'USB-C 65W GaN Fast Charger',1699.00,1,1699.00,NOW()-INTERVAL '20 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,card_last4,created_at,updated_at)
    VALUES(o18,c_rohit,'CARD','REFUNDED','DEMO-TXN-018-ROHIT2',1699.00,'SANDBOX_SECUREPAY','7777',NOW()-INTERVAL '20 days',NOW()-INTERVAL '18 days');

    -- CANCELLED ORDER 19: Keerthana - JumpRope (no longer needed)
    INSERT INTO orders(customer_id,shipping_full_name,shipping_phone,shipping_line1,shipping_city,shipping_state,shipping_postal_code,shipping_country,status,total_amount,subtotal_amount,discount_amount,cancellation_reason,cancelled_at,created_at,updated_at)
    VALUES(c_keerthana,'Keerthana Rao','9876504004','32, Seethammadhara Main Rd','Visakhapatnam','Andhra Pradesh','530013','India','CANCELLED',549.00,549.00,0.00,'Item no longer needed',NOW()-INTERVAL '12 days',NOW()-INTERVAL '14 days',NOW()-INTERVAL '12 days') RETURNING id INTO o19;
    INSERT INTO order_items(order_id,product_id,seller_id,product_name_snapshot,price_snapshot,quantity,line_total,created_at) VALUES
    (o19,p_jumprope,s_pavan,'Jump Rope Speed Cable Skipping',549.00,1,549.00,NOW()-INTERVAL '14 days');
    INSERT INTO payments(order_id,customer_id,payment_method,payment_status,transaction_id,amount,payment_gateway,upi_id_snapshot,created_at,updated_at)
    VALUES(o19,c_keerthana,'UPI','REFUNDED','DEMO-TXN-019-KEERTHANA2',549.00,'SANDBOX_SECUREPAY','keerthana@upi',NOW()-INTERVAL '14 days',NOW()-INTERVAL '12 days');
END $$;

-- SECTION 6: REVIEWS (14 verified purchase reviews for DELIVERED orders only)
DO $$
DECLARE
    c_ravi BIGINT; c_sravani BIGINT; c_harsha BIGINT; c_keerthana BIGINT; c_anjali BIGINT;
    c_rohit BIGINT; c_priya BIGINT; c_arjun BIGINT;
    p_earbuds BIGINT; p_speaker BIGINT; p_cookware BIGINT; p_lamp BIGINT;
    p_kurta BIGINT; p_shoes BIGINT; p_camera BIGINT;
    p_bands BIGINT; p_dumbbells BIGINT; p_shirt BIGINT;
    p_niacinamide BIGINT; p_sunscreen BIGINT; p_alchemist BIGINT; p_atomic BIGINT;
    o1 BIGINT; o2 BIGINT; o3 BIGINT; o4 BIGINT; o5 BIGINT;
    o6 BIGINT; o7 BIGINT; o8 BIGINT;
BEGIN
    SELECT id INTO c_ravi      FROM users WHERE email='ravi.kumar@shopivo.demo';
    SELECT id INTO c_sravani   FROM users WHERE email='sravani.reddy@shopivo.demo';
    SELECT id INTO c_harsha    FROM users WHERE email='harsha.vardhan@shopivo.demo';
    SELECT id INTO c_keerthana FROM users WHERE email='keerthana.rao@shopivo.demo';
    SELECT id INTO c_anjali    FROM users WHERE email='anjali.sharma@shopivo.demo';
    SELECT id INTO c_rohit     FROM users WHERE email='rohit.verma@shopivo.demo';
    SELECT id INTO c_priya     FROM users WHERE email='priya.nair@shopivo.demo';
    SELECT id INTO c_arjun     FROM users WHERE email='arjun.mehta@shopivo.demo';
    SELECT id INTO p_earbuds    FROM products WHERE slug='true-wireless-earbuds-pro-raja';
    SELECT id INTO p_speaker    FROM products WHERE slug='portable-bluetooth-speaker-20w-raja';
    SELECT id INTO p_cookware   FROM products WHERE slug='stainless-steel-cookware-set-5pc-srinivas';
    SELECT id INTO p_lamp       FROM products WHERE slug='led-desk-lamp-usb-charging-srinivas';
    SELECT id INTO p_kurta      FROM products WHERE slug='mens-regular-fit-casual-kurta-kiran';
    SELECT id INTO p_shoes      FROM products WHERE slug='mens-running-shoes-lightweight-kiran';
    SELECT id INTO p_camera     FROM products WHERE slug='smart-home-security-camera-1080p-mahesh';
    SELECT id INTO p_bands      FROM products WHERE slug='resistance-band-set-5-levels-pavan';
    SELECT id INTO p_dumbbells  FROM products WHERE slug='adjustable-dumbbell-set-10kg-pavan';
    SELECT id INTO p_shirt      FROM products WHERE slug='mens-oxford-formal-shirt-rahul';
    SELECT id INTO p_niacinamide FROM products WHERE slug='niacinamide-10-face-serum-30ml-amit';
    SELECT id INTO p_sunscreen  FROM products WHERE slug='sunscreen-spf50-pa-plus-100ml-amit';
    SELECT id INTO p_alchemist  FROM products WHERE slug='the-alchemist-paulo-coelho-vivek';
    SELECT id INTO p_atomic     FROM products WHERE slug='atomic-habits-james-clear-vivek';
    SELECT o.id INTO o1 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-001-RAVI';
    SELECT o.id INTO o2 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-002-SRAVANI';
    SELECT o.id INTO o3 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-003-HARSHA';
    SELECT o.id INTO o4 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-004-KEERTHANA';
    SELECT o.id INTO o5 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-005-ANJALI';
    SELECT o.id INTO o6 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-006-ROHIT';
    SELECT o.id INTO o7 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-007-PRIYA';
    SELECT o.id INTO o8 FROM orders o JOIN payments p ON p.order_id=o.id WHERE p.transaction_id='DEMO-TXN-008-ARJUN';
    IF c_ravi IS NULL OR p_earbuds IS NULL OR o1 IS NULL THEN RETURN; END IF;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_earbuds,c_ravi,o1,5,'Absolutely love these earbuds! Sound quality is incredible for the price, bass is punchy and noise cancellation is great for daily commute. Battery easily lasts 2 days. Highly recommended!',TRUE,NOW()-INTERVAL '70 days',NOW()-INTERVAL '70 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_speaker,c_ravi,o1,4,'Very good portable speaker with great 360-degree sound. Used it at a small get-together and everyone loved it. Battery life is as advertised. Dock connector placement could be better.',TRUE,NOW()-INTERVAL '69 days',NOW()-INTERVAL '69 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_cookware,c_sravani,o2,5,'Excellent quality cookware set! The stainless steel is thick and distributes heat evenly. Made rasam and sambar and they tasted perfect. Very happy with this purchase.',TRUE,NOW()-INTERVAL '66 days',NOW()-INTERVAL '66 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_lamp,c_sravani,o2,4,'Nice desk lamp with good brightness adjustment. USB charging port is very convenient. I use warm white mode for evening reading. Would be 5 stars if the arm was a bit more flexible.',TRUE,NOW()-INTERVAL '65 days',NOW()-INTERVAL '65 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_kurta,c_harsha,o3,5,'Superb quality kurta! The cotton fabric is very soft and breathable, perfect for Hyderabad weather. Stitching is neat and colour is exactly as shown in photo. Ordered again in two more colours!',TRUE,NOW()-INTERVAL '59 days',NOW()-INTERVAL '59 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_shoes,c_harsha,o3,4,'Very lightweight and comfortable running shoes. I jog 5km every morning and these are great. Grip is decent on both road and gym floor. Size runs slightly large so order half size down.',TRUE,NOW()-INTERVAL '58 days',NOW()-INTERVAL '58 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_camera,c_keerthana,o4,5,'Excellent home security camera! Setup was very easy, connected to phone in under 5 minutes. Night vision is clear up to about 8 metres. Two-way audio works perfectly. Great value for money.',TRUE,NOW()-INTERVAL '52 days',NOW()-INTERVAL '52 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_niacinamide,c_anjali,o5,5,'This serum is a game changer for my skin! Pores look visibly smaller after 3 weeks of regular use. Lightweight, no stickiness, absorbs quickly. Fragrance-free which is great for sensitive skin.',TRUE,NOW()-INTERVAL '44 days',NOW()-INTERVAL '44 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_sunscreen,c_anjali,o5,4,'Very good daily sunscreen. No white cast at all which was my main concern. Sits well under makeup. SPF 50 gives me confidence even during afternoon outings. Will definitely repurchase.',TRUE,NOW()-INTERVAL '43 days',NOW()-INTERVAL '43 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_dumbbells,c_rohit,o6,5,'Solid adjustable dumbbells at a great price! Screw-lock collars hold firm during intense workouts. No wobble at all. Weight plates are well-finished. Must-have for home gym setup.',TRUE,NOW()-INTERVAL '36 days',NOW()-INTERVAL '36 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_bands,c_rohit,o6,4,'Good quality resistance bands. All 5 resistance levels are useful for different exercises. Latex material feels durable and has good stretch. The carry bag is a nice bonus. Worth the money.',TRUE,NOW()-INTERVAL '35 days',NOW()-INTERVAL '35 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_shirt,c_priya,o7,5,'Outstanding formal shirt! Oxford weave fabric is smooth and fit is perfect. Wore it for an office presentation and received several compliments. Washed well with no colour fading at all.',TRUE,NOW()-INTERVAL '29 days',NOW()-INTERVAL '29 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_alchemist,c_arjun,o8,5,'A timeless classic that I am reading for the third time. Paperback edition is well-printed with clear text and good binding. The philosophical lessons in this book are truly life-changing.',TRUE,NOW()-INTERVAL '22 days',NOW()-INTERVAL '22 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;

    INSERT INTO reviews(product_id,customer_id,order_id,rating,review_text,verified_purchase,created_at,updated_at)
    VALUES(p_atomic,c_arjun,o8,5,'One of the best self-improvement books I have read. James Clear breaks down habit formation into actionable systems. I already implemented the 2-minute rule and it is working brilliantly!',TRUE,NOW()-INTERVAL '21 days',NOW()-INTERVAL '21 days')
    ON CONFLICT(customer_id,product_id) DO NOTHING;
END $$;