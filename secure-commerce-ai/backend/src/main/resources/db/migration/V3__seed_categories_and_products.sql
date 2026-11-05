-- V3__seed_categories_and_products.sql
-- Inserts sample categories and products for development/demo.
-- Products are seeded as APPROVED so they appear immediately on the browse page.
-- seller_id = 1 assumes the first registered user becomes a seller for seed data.
-- If no users exist yet, this will fail at runtime — register a user first
-- OR use a dedicated seed user created here.

-- ─── Seed a demo seller user (if not already present) ────────
-- We use ON CONFLICT DO NOTHING so re-running is safe.
INSERT INTO users (email, password_hash, first_name, last_name, role, enabled, created_at, updated_at)
VALUES (
    'seller@securecommerce.dev',
    '$2a$12$placeholder_hash_replaced_at_runtime',
    'Demo',
    'Seller',
    'SELLER',
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- ─── Root Categories ─────────────────────────────────────────
INSERT INTO categories (name, slug, description, parent_id, is_active) VALUES
    ('Electronics',       'electronics',       'Gadgets, devices, and tech accessories', NULL, TRUE),
    ('Clothing',          'clothing',          'Fashion for men, women, and kids',       NULL, TRUE),
    ('Books',             'books',             'Fiction, non-fiction, and textbooks',    NULL, TRUE),
    ('Home & Kitchen',    'home-kitchen',      'Appliances, decor, and cookware',        NULL, TRUE),
    ('Sports & Outdoors', 'sports-outdoors',   'Gear for active lifestyles',             NULL, TRUE),
    ('Beauty & Care',     'beauty-care',       'Skincare, makeup, and wellness',         NULL, TRUE);

-- ─── Seed Products ───────────────────────────────────────────
-- seller_id is looked up dynamically so the seed works regardless of user ID.
DO $$
DECLARE
    seller_id   BIGINT;
    cat_electronics  BIGINT;
    cat_clothing     BIGINT;
    cat_books        BIGINT;
    cat_home         BIGINT;
    cat_sports       BIGINT;
    cat_beauty       BIGINT;
BEGIN
    SELECT id INTO seller_id   FROM users      WHERE email = 'seller@securecommerce.dev';
    SELECT id INTO cat_electronics FROM categories WHERE slug = 'electronics';
    SELECT id INTO cat_clothing    FROM categories WHERE slug = 'clothing';
    SELECT id INTO cat_books       FROM categories WHERE slug = 'books';
    SELECT id INTO cat_home        FROM categories WHERE slug = 'home-kitchen';
    SELECT id INTO cat_sports      FROM categories WHERE slug = 'sports-outdoors';
    SELECT id INTO cat_beauty      FROM categories WHERE slug = 'beauty-care';

    INSERT INTO products (seller_id, category_id, name, slug, description, price, stock_quantity, image_url, status) VALUES
    (seller_id, cat_electronics, 'Wireless Noise-Cancelling Headphones',
     'wireless-noise-cancelling-headphones',
     'Premium over-ear headphones with 40-hour battery life and active noise cancellation. Compatible with all Bluetooth devices.',
     4999.00, 50,
     'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
     'APPROVED'),

    (seller_id, cat_electronics, 'Smart Watch Pro X',
     'smart-watch-pro-x',
     'Feature-packed smartwatch with health tracking, GPS, and 7-day battery. Water resistant up to 50m.',
     12999.00, 30,
     'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400',
     'APPROVED'),

    (seller_id, cat_electronics, 'Mechanical Gaming Keyboard',
     'mechanical-gaming-keyboard',
     'TKL mechanical keyboard with Cherry MX switches, per-key RGB, and aluminum frame. N-key rollover.',
     6499.00, 75,
     'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400',
     'APPROVED'),

    (seller_id, cat_clothing, 'Classic Fit Cotton T-Shirt',
     'classic-fit-cotton-t-shirt',
     '100% premium organic cotton. Pre-shrunk, tag-free, available in 12 colors and sizes XS–3XL.',
     599.00, 200,
     'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
     'APPROVED'),

    (seller_id, cat_clothing, 'Slim-Fit Chinos',
     'slim-fit-chinos',
     'Versatile stretch chinos for office and weekend. Wrinkle-resistant fabric, multiple pockets.',
     1299.00, 120,
     'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400',
     'APPROVED'),

    (seller_id, cat_books, 'Clean Code: A Handbook of Agile Software Craftsmanship',
     'clean-code-handbook',
     'Robert C. Martin''s definitive guide to writing maintainable, professional code. A must-read for every developer.',
     849.00, 90,
     'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
     'APPROVED'),

    (seller_id, cat_books, 'Designing Data-Intensive Applications',
     'designing-data-intensive-applications',
     'Martin Kleppmann''s deep dive into the principles of building reliable, scalable, and maintainable data systems.',
     1199.00, 60,
     'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
     'APPROVED'),

    (seller_id, cat_home, 'Stainless Steel Insulated Bottle 1L',
     'stainless-steel-insulated-bottle-1l',
     'Keeps drinks cold 24h, hot 12h. Double-wall vacuum insulated, BPA-free, leak-proof lid.',
     899.00, 150,
     'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
     'APPROVED'),

    (seller_id, cat_sports, 'Yoga Mat Premium 6mm',
     'yoga-mat-premium-6mm',
     'Non-slip natural rubber yoga mat with alignment lines. Includes carry strap. 183cm × 61cm.',
     1499.00, 80,
     'https://images.unsplash.com/photo-1601925228088-6bc83e9a1a5f?w=400',
     'APPROVED'),

    (seller_id, cat_beauty, 'Vitamin C Brightening Serum',
     'vitamin-c-brightening-serum',
     '20% L-Ascorbic Acid serum with hyaluronic acid and vitamin E. Reduces dark spots in 4 weeks. Dermatologist tested.',
     1799.00, 45,
     'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
     'APPROVED');
END $$;
