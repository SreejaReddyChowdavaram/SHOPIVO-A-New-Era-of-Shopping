"""
populate_100_products.py
Transforms SHOPIVO marketplace into a 100-product college project demo catalog:
- 13 Categories (6 existing updated + 7 new)
- Exactly 100 Products (38 existing updated + 62 new inserted)
- Prices strictly below ₹100 (₹19 - ₹99)
- 100 Relevant product images downloaded locally to backend/data/uploads/products/
- All products APPROVED, with valid stock, distributed across 5 approved sellers
"""

import os
import sys
import time
import ssl
import urllib.request
import psycopg2
from decimal import Decimal

UPLOAD_DIR = os.path.abspath(r"C:\Users\SREEJA\Documents\Fraud Detection\secure-commerce-ai\backend\data\uploads\products")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 13 Categories definition
CATEGORIES = [
    (1, "Electronics", "electronics", "High-performance consumer electronics, premium audio gear, smart displays, and modern computing devices.", True),
    (2, "Clothing", "clothing", "Contemporary men's and women's apparel, breathable casuals, formalwear, and premium seasonal collections.", True),
    (3, "Books & Stationery", "books-stationery", "Best-selling novels, academic reference books, premium notebooks, luxury pens, and desk organisers.", True),
    (4, "Home & Kitchen", "home-kitchen", "Durable cookware, modern kitchen appliances, airtight storage sets, and functional home utility essentials.", True),
    (5, "Sports & Fitness", "sports-fitness", "Durable sports gear, gym accessories, training weights, yoga mats, and active lifestyle equipment.", True),
    (6, "Beauty & Personal Care", "beauty-personal-care", "Dermatologist-tested skincare serums, organic haircare, herbal face ubtans, and premium cosmetic formulations.", True),
    (7, "Footwear", "footwear", "Ergonomic running sneakers, formal leather shoes, lightweight canvas loafers, and cushioned comfort sliders.", True),
    (8, "Watches", "watches", "Minimalist analog wristwatches, rugged digital chronographs, luxury mesh timepieces, and everyday sports watches.", True),
    (9, "Bags & Accessories", "bags-accessories", "Waterproof commuter backpacks, genuine leather bifold wallets, travel duffels, and everyday cardholders.", True),
    (10, "Mobile Accessories", "mobile-accessories", "Braided fast-charging cables, MagSafe-compatible phone cases, 9H tempered glass, and car mounts.", True),
    (11, "Home Decor", "home-decor", "Aesthetic ceramic vases, soothing soy scented candles, warm ambient fairy lights, and minimalist wall canvas art.", True),
    (12, "Toys & Games", "toys-games", "Wooden brain-teaser puzzles, classic family board games, magnetic building tiles, and plush comfort toys.", True),
    (13, "Grocery & Daily Essentials", "grocery-daily-essentials", "Cold-pressed organic oils, premium roasted nuts, aromatic whole spices, and artisan herbal green teas.", True)
]

# Sellers:
# 194: TechNova Electronics
# 195: UrbanStyle Fashion
# 196: HomeNest Living
# 197: BeautyBloom Store
# 198: FitZone Sports

# Catalog of 100 products:
# (id, name, slug, category_id, seller_id, price, stock, filename, unsplash_id, description)
# Note: For existing 38 products, id is specified (333 to 370). For new 62 products, id is None.

PRODUCTS_DATA = [
    # --- Category 1: Electronics (8 products, IDs 333-340) ---
    (333, "Sony WH-1000XM5 Wireless Noise Cancelling Headphones", "sony-wh-1000xm5-wireless-noise-cancelling-headphones", 1, 194, 89.00, 45,
     "electronics-sony-wh1000xm5.jpg", "photo-1505740420928-5e560c06d30e",
     "Industry-leading noise cancellation powered by dual processors and 8 microphones. Features Auto NC Optimizer, 30-hour battery life, and crystal-clear hands-free calling with beamforming microphones."),
    
    (334, "Apple AirPods Pro 2nd Generation with MagSafe Case", "apple-airpods-pro-2nd-generation-magsafe", 1, 194, 79.00, 60,
     "electronics-apple-airpods-pro.jpg", "photo-1600294037681-c80b4cb5b434",
     "Active Noise Cancellation with Adaptive Audio and Transparency mode. Powered by the Apple H2 headphone chip, offering personalized spatial audio with dynamic head tracking and up to 30 hours of total listening time."),
    
    (335, "Samsung 55-Inch QLED 4K Smart TV Q70C", "samsung-55-inch-qled-4k-smart-tv", 1, 194, 99.00, 20,
     "electronics-samsung-qled-tv.jpg", "photo-1593784991095-a205069470b6",
     "Quantum Processor 4K with AI upscaling, 100% Color Volume with Quantum Dot technology, Motion Xcelerator Turbo+ for 120Hz smooth gaming, and built-in Smart Hub streaming platform."),
    
    (336, "MacBook Air M2 Chip 13-Inch 8GB RAM 256GB SSD", "macbook-air-m2-chip-13-inch", 1, 194, 99.00, 18,
     "electronics-macbook-air-m2.jpg", "photo-1517336714731-489689fd1ca8",
     "Strikingly thin design with a 13.6-inch Liquid Retina display, 500 nits brightness, Apple M2 chip with 8-core CPU and 10-core GPU, up to 18 hours of battery life, and MagSafe fast charging."),
    
    (337, "Realme Narzo 70 Pro 5G Smartphone 8GB+128GB", "realme-narzo-70-pro-5g-smartphone", 1, 194, 89.00, 40,
     "electronics-realme-narzo-5g.jpg", "photo-1511707171634-5f897ff02aa9",
     "Sony IMX890 OIS flagship camera sensor, 120Hz AMOLED display, Dimensity 7050 5G chipset, 67W SUPERVOOC fast charging, and air gesture navigation controls."),
    
    (338, "Logitech MX Master 3S Wireless Mouse", "logitech-mx-master-3s-wireless-mouse", 1, 194, 59.00, 75,
     "electronics-logitech-mx-master-3s.jpg", "photo-1527864550417-7fd91fc51a46",
     "Quiet Clicks ergonomic mouse with 8000 DPI tracking on any glass surface, MagSpeed electromagnetic scrolling at 1000 lines per second, and multi-device Flow cross-computer control."),
    
    (339, "GoPro HERO12 Black Action Camera 5.3K", "gopro-hero12-black-action-camera", 1, 194, 95.00, 25,
     "electronics-gopro-hero12-black.jpg", "photo-1526170375885-4d8ecf77b99f",
     "Incredible 5.3K60 video resolution, HyperSmooth 6.0 award-winning stabilization, rugged waterproof build up to 33ft, HDR video capabilities, and Bluetooth audio support for external mics."),
    
    (340, "Anker 727 Charging Station 100W GaN Desktop Charger", "anker-727-charging-station-100w-gan", 1, 194, 49.00, 80,
     "electronics-anker-100w-gan-charger.jpg", "photo-1609592424368-450ef77732d8",
     "Ultra-compact 6-in-1 power strip with 2 USB-C ports, 2 USB-A ports, and 2 AC outlets. GaNPrime technology delivers up to 100W high-speed charging to laptops, phones, and tablets simultaneously."),

    # --- Category 2: Clothing (8 products, IDs 341-348) ---
    (341, "Men's Premium Oxford Cotton Shirt — Slim Fit", "mens-premium-oxford-cotton-shirt", 2, 195, 49.00, 50,
     "clothing-mens-oxford-shirt.jpg", "photo-1596755094514-f87e34085b2c",
     "100% long-staple combed cotton woven in a timeless Oxford basketweave. Button-down collar, tailored slim fit silhouette, wrinkle-resistant finish, and mother-of-pearl style buttons."),
    
    (342, "Women's Rayon Printed Palazzo Set with Dupatta", "womens-rayon-printed-palazzo-set", 2, 195, 59.00, 65,
     "clothing-womens-palazzo-set.jpg", "photo-1583391733956-3750e0ff4e8b",
     "Elegant ethnic floral printed straight kurta paired with wide-leg breathable rayon palazzo pants and a matching lightweight chiffon dupatta. Ideal for festive and casual daily wear."),
    
    (343, "Men's Slim Fit Denim Jeans — Stretch Comfort Waist", "mens-slim-fit-denim-jeans", 2, 195, 69.00, 55,
     "clothing-mens-denim-jeans.jpg", "photo-1542272604-780c96856592",
     "Classic 5-pocket blue wash denim crafted from 98% cotton and 2% elastane for unrestricted all-day flexibility. Reinforced bar-tack stitching and antique brass metal zipper fly."),
    
    (344, "Women's Cotton A-Line Midi Dress with Pockets", "womens-cotton-a-line-midi-dress", 2, 195, 55.00, 40,
     "clothing-womens-cotton-midi-dress.jpg", "photo-1496747611176-843222e1e57c",
     "Breathable pure organic cotton midi dress featuring a flattering square neckline, smocked bodice, discreet side seam pockets, and a flared tier skirt suitable for warm sunny outings."),
    
    (345, "Men's Linen Casual Shirt — Half Sleeve Summer", "mens-linen-casual-shirt-half-sleeve", 2, 195, 45.00, 60,
     "clothing-mens-linen-shirt.jpg", "photo-1521572267360-ee0c2909d518",
     "Lightweight pure linen casual half-sleeve shirt with Cuban camp collar. Naturally cooling, sweat-wicking texture, and relaxed comfort cut designed for breezy summer weekends."),
    
    (346, "Women's Pure Silk Saree with Blouse Piece — Kanjivaram Inspired", "womens-pure-silk-saree-kanjivaram", 2, 195, 95.00, 30,
     "clothing-womens-silk-saree.jpg", "photo-1610030469983-98e550d6193c",
     "Artisan-crafted rich mulberry art silk saree with ornate golden zari borders and intricately woven pallu. Comes with an unstitched coordinated 80cm blouse piece."),
    
    (347, "Unisex Oversized Graphic Hoodie — 380GSM Fleece", "unisex-oversized-graphic-hoodie", 2, 195, 65.00, 70,
     "clothing-unisex-graphic-hoodie.jpg", "photo-1556905055-8f358a7a47b2",
     "Heavyweight 380 GSM fleece cotton-poly blend hoodie with kangaroo front pocket, drop shoulders, double-layered hood, and minimal contemporary streetwear screen print on back."),
    
    (348, "Women's Formal Blazer — Tailored Single Button", "womens-formal-blazer-tailored", 2, 195, 79.00, 35,
     "clothing-womens-formal-blazer.jpg", "photo-1591047139829-d91aecb6caea",
     "Sharp structured single-button corporate blazer made with wrinkle-recovery suiting fabric. Features peaked lapels, silky inner lining, functional flap pockets, and back vent slit."),

    # --- Category 3: Books & Stationery (8 products, all new) ---
    (None, "Atomic Habits by James Clear — Hardcover Edition", "atomic-habits-james-clear-hardcover", 3, 194, 39.00, 85,
     "books-atomic-habits.jpg", "photo-1544716278-ca5e3f4abd8c",
     "The #1 New York Times bestseller detailing proven practical strategies to break bad habits and form good ones through incremental 1% daily changes. High quality archival hardcover binding."),
    
    (None, "Classic Hardcover Ruled Journal Notebook — 240 Pages", "classic-hardcover-ruled-journal-notebook", 3, 194, 25.00, 90,
     "stationery-hardcover-ruled-journal.jpg", "photo-1531346878377-a5be20888e57",
     "A5 faux-leather notebook with 100 GSM acid-free ink-proof paper, inner expandable pocket, ribbon bookmark, and elastic band closure. Ideal for bullet journaling and daily notes."),
    
    (None, "Parker Jotter Stainless Steel Ballpoint Pen with Chrome Trim", "parker-jotter-ballpoint-pen", 3, 194, 29.00, 100,
     "stationery-parker-jotter-pen.jpg", "photo-1583485088034-697b5bc54ccd",
     "Iconic stainless steel barrel with Parker's signature arrow clip and satisfying click mechanism. Includes Quinkflow blue ballpoint refill for effortless smooth writing."),
    
    (None, "The Psychology of Money by Morgan Housel", "psychology-of-money-morgan-housel", 3, 194, 35.00, 75,
     "books-psychology-of-money.jpg", "photo-1512820790803-83ca734da794",
     "Timeless lessons on wealth, greed, and happiness. Morgan Housel shares 19 short stories exploring the strange ways people think about money and teaches how to manage your financial life better."),
    
    (None, "Wooden Desk Organiser & Pen Stand with Drawer", "wooden-desk-organiser-pen-stand", 3, 196, 45.00, 50,
     "stationery-wooden-desk-organiser.jpg", "photo-1584679109597-c656b19974c9",
     "Natural bamboo multi-tier desktop stationery organiser with 4 pen slots, smartphone resting dock, sticky note tray, and a slide-out drawer for paperclips and small accessories."),
    
    (None, "Faber-Castell 48 Triangular Watercolour Pencils Set", "faber-castell-watercolour-pencils-48", 3, 194, 49.00, 60,
     "stationery-faber-castell-pencils.jpg", "photo-1513542789411-b6a5d4f31634",
     "Vibrant artist-grade water-soluble colored pencils with ergonomic triangular grip. Break-resistant SV bonded leads that dissolve easily with water for stunning watercolor painting effects."),
    
    (None, "Deep Work by Cal Newport — Rules for Focused Success", "deep-work-cal-newport", 3, 194, 35.00, 80,
     "books-deep-work-cal-newport.jpg", "photo-1495446815901-a7297e633e8d",
     "Wall Street Journal business bestseller providing actionable framework to master cognitive focus in a distracted world and produce exceptional work in less time."),
    
    (None, "Adjustable Aluminum Ergonomic Book & Tablet Stand", "adjustable-aluminum-book-tablet-stand", 3, 194, 55.00, 40,
     "stationery-aluminum-book-stand.jpg", "photo-1544947950-fa07a98d237f",
     "Heavy-duty sandblasted aluminum reading rest with spring page clips, 360-degree rotating base, and height adjustments to eliminate neck strain during long study sessions."),

    # --- Category 4: Home & Kitchen (8 products, IDs 349-355 updated + 1 new) ---
    (349, "Borosil Glass Storage Jar Set of 7 with Airtight Lids", "borosil-glass-storage-jar-set-7", 4, 196, 69.00, 45,
     "home-borosil-glass-jar-set.jpg", "photo-1584308666744-24d5c474f2ae",
     "100% borosilicate glass food containers that are microwave, oven, freezer, and dishwasher safe. Includes BPA-free leak-proof locking lids with food-grade silicone seals."),
    
    (350, "Prestige Svachh 5L Pressure Cooker with Deep Lid", "prestige-svachh-5l-pressure-cooker", 4, 196, 79.00, 35,
     "home-prestige-pressure-cooker.jpg", "photo-1584990347449-a21390310243",
     "Innovative Svachh spillage-control deep lid prevents starchy liquid frothing onto the stovetop. Features durable virgin aluminum construction, gas & induction compatible Alpha base."),
    
    (351, "Nilkamal Orthopaedic Memory Foam Mattress 6-Inch King", "nilkamal-orthopaedic-memory-foam-mattress", 4, 196, 99.00, 15,
     "home-nilkamal-memory-foam-mattress.jpg", "photo-1582533561751-ef6f6ab93a2e",
     "Dual-layer spinal alignment technology with high-density rebonded support core and gel memory foam comfort top. Wrapped in breathable hypoallergenic knitted jacquard fabric."),
    
    (352, "Philips Air Fryer HD9252 4.1L Digital", "philips-air-fryer-hd9252-digital", 4, 196, 89.00, 30,
     "home-philips-air-fryer.jpg", "photo-1556911220-e15b29be8c8f",
     "Rapid Air technology circulates hot air to cook deliciously crispy food with up to 90% less fat. Touchscreen panel with 7 pre-set cooking programs and keep-warm function."),
    
    (353, "Godrej Interio 6-Piece Modular Kitchen Organiser Set", "godrej-interio-kitchen-organiser-set", 4, 196, 49.00, 60,
     "home-godrej-kitchen-organiser.jpg", "photo-1556912173-3bb406ef7e77",
     "Food-grade BPA-free stackable drawer organizer bins with anti-skid silicone feet. Modular sizing keeps cutleries, spice packets, and cooking utensils neatly arranged."),
    
    (354, "Story@Home 450TC Egyptian Cotton Bedsheet Set — King", "storyathome-450tc-egyptian-cotton-bedsheet", 4, 196, 59.00, 50,
     "home-cotton-bedsheet-set.jpg", "photo-1522771739844-6a9f6d5f14af",
     "Luxurious 450 thread count Egyptian satin weave king bedsheet with 2 matching envelope pillow covers. Silky smooth handfeel, fade-resistant reactive dyes, and deep corner pockets."),
    
    (355, "iBell Prism 1.8L Stainless Steel Electric Kettle", "ibell-prism-electric-kettle-1-8l", 4, 196, 45.00, 65,
     "home-ibell-electric-kettle.jpg", "photo-1578749556568-bc2c40e68b61",
     "1500W rapid boil kettle with SUS304 food-grade stainless steel interior, 360-degree swivel cordless power base, automatic shut-off safety protection, and dry boil cutout."),
    
    (None, "ChefPro 3-Piece Non-Stick Granite Cookware Set", "chefpro-3-piece-nonstick-granite-set", 4, 196, 85.00, 40,
     "home-chefpro-cookware-set.jpg", "photo-1584990347449-a21390310243",
     "German stone granite coating free of PFOA, lead, and cadmium. Set includes 24cm frying pan, 24cm kadai with tempered glass lid, and 28cm flat dosa tawa compatible with induction and gas."),

    # --- Category 5: Sports & Fitness (8 products, IDs 363-369 updated + 1 new) ---
    (363, "Nivia Storm Football Size 5 — Match Quality", "nivia-storm-football-size-5", 5, 198, 39.00, 70,
     "sports-nivia-storm-football.jpg", "photo-1579952363873-27f3bade9f55",
     "FIFA-standard 32-panel hand-stitched construction with abrasion-resistant PU outer casing, reinforced latex bladder for superior air retention, and stable aerodynamic trajectory."),
    
    (364, "Yonex Nanoray Dynamic Series Badminton Racquet", "yonex-nanoray-badminton-racquet", 5, 198, 59.00, 55,
     "sports-yonex-badminton-racquet.jpg", "photo-1626224583764-f87db24ac4ea",
     "Head-light balance with Aero Frame geometry for lightning-fast swing recovery. High-modulus graphite shaft pre-strung to 24 lbs tension with full protective zip carrying cover."),
    
    (365, "Boldfit Premium Gym Gloves with Wrist Support", "boldfit-premium-gym-gloves-wrist-support", 5, 198, 29.00, 90,
     "sports-boldfit-gym-gloves.jpg", "photo-1584865288642-42078afe6942",
     "Breathable mesh workout gloves with textured honeycomb silicone palm padding for maximum barbell grip. Includes 16-inch elastic integrated wrist wrap for heavy lifting stabilization."),
    
    (366, "Decathlon Kiprun KS900 Running Shoes — Men's", "decathlon-kiprun-ks900-running-shoes", 5, 198, 89.00, 35,
     "sports-decathlon-running-shoes.jpg", "photo-1542291026-7eec264c27ff",
     "High-cushioning long-distance road running shoes with M-FOAM responsive midsole. Engineered jacquard breathable mesh upper and durable grip rubber outsole suitable for 10K to marathon training."),
    
    (367, "Healthgenie 90kg Capacity Digital Weighing Scale", "healthgenie-digital-weighing-scale", 5, 198, 45.00, 60,
     "sports-healthgenie-weighing-scale.jpg", "photo-1576091160399-112ba8d25d1d",
     "Tempered 6mm safety glass personal bathroom scale with step-on auto-calibration, high-precision strain gauge sensors, backlit LCD display, and low battery overload indicator."),
    
    (368, "Strauss Adjustable Dumbbell Set 10kg Pair with Bag", "strauss-adjustable-dumbbell-set-10kg", 5, 198, 79.00, 40,
     "sports-strauss-dumbbell-set.jpg", "photo-1583454110551-21f2fa2afe61",
     "Cast iron weight plates with electroplated rust-free chrome finish. Includes knurled slip-resistant dumbbell bars, star-lock safety collars, and a molded plastic travel case."),
    
    (369, "Cockatoo CFR-05 Skipping Rope with Counter — Adult", "cockatoo-skipping-rope-counter", 5, 198, 19.00, 100,
     "sports-cockatoo-skipping-rope.jpg", "photo-1518611012118-696072aa579a",
     "Adjustable 9-foot PVC tangle-free jump rope with built-in 3-digit mechanical rotation counter. Ergonomic foam sweat-absorbent handles and 360-degree ball bearing pivot for rapid speed cardio."),
    
    (None, "Vessel 6mm Eco-Friendly TPE Anti-Slip Yoga Mat", "vessel-eco-friendly-tpe-yoga-mat", 5, 198, 49.00, 50,
     "sports-eco-friendly-yoga-mat.jpg", "photo-1601925260368-ae2f83cf8b7f",
     "Dual-layer textured non-slip TPE yoga mat with body alignment position lines. High density 6mm cushioning protects joints, water-resistant closed-cell surface with carrying strap."),

    # --- Category 6: Beauty & Personal Care (8 products, IDs 356-362 + 370 updated) ---
    (356, "Mamaearth Vitamin C Face Serum with Turmeric 30ml", "mamaearth-vitamin-c-face-serum-30ml", 6, 197, 39.00, 85,
     "beauty-mamaearth-vitamin-c-serum.jpg", "photo-1620916566398-39f1143ab7be",
     "Enriched with natural Vitamin C and Turmeric to illuminate dull skin, fade dark spots, and boost collagen production. Dermatologically tested, free of sulfates, parabens, and mineral oils."),
    
    (357, "L'Oreal Paris Revitalift 1.5% Pure Hyaluronic Acid Serum 30ml", "loreal-revitalift-hyaluronic-acid-serum", 6, 197, 49.00, 75,
     "beauty-loreal-hyaluronic-acid-serum.jpg", "photo-1608248597359-7157833a695e",
     "Intensive plumping facial serum with micro-hyaluronic acid molecules that penetrate deeply into skin layers. Instantly hydrates, visibly smooths fine lines, and restores radiant youthful bounce."),
    
    (358, "Forest Essentials Facial Ubtan Brightening Face Pack 100g", "forest-essentials-facial-ubtan-100g", 6, 197, 69.00, 45,
     "beauty-forest-essentials-ubtan.jpg", "photo-1556228720-195a672e8a03",
     "Traditional Ayurvedic formulation of hand-pounded sweet almonds, saffron, turmeric, and fenugreek seeds. Gently exfoliates dead cells, unclogs pores, and imparts natural golden radiance."),
    
    (359, "Khadi Natural Keratin Repair Shampoo 300ml", "khadi-natural-keratin-repair-shampoo", 6, 197, 29.00, 90,
     "beauty-khadi-keratin-shampoo.jpg", "photo-1535585209827-a15fcdbc4c2d",
     "Sulfate-free herbal shampoo infused with vegetable keratin, amla, and bhringraj extracts. Restores damaged hair cuticles, controls frizz, and prevents split ends with natural herbal nourishment."),
    
    (360, "Biotique Bio Coconut Whitening and Brightening Cream 50g", "biotique-bio-coconut-brightening-cream", 6, 197, 25.00, 95,
     "beauty-biotique-coconut-cream.jpg", "photo-1522337360788-8b13dee7a37e",
     "100% botanical extract cream blended with pure virgin coconut oil, dandelion, and manjistha. Fades sun tan, brightens uneven skin tone, and deeply moisturizes without greasy residue."),
    
    (361, "Sugar Cosmetics Matte Attack Transferproof Lipstick", "sugar-cosmetics-matte-attack-lipstick", 6, 197, 35.00, 80,
     "beauty-sugar-matte-lipstick.jpg", "photo-1586495777744-4413f21062fa",
     "Ultra-pigmented lightweight matte lipstick with zero-transfer staying power up to 12 hours. Enriched with jojoba oil to keep lips hydrated while delivering intense velvety color payoff."),
    
    (362, "The Ordinary Niacinamide 10% + Zinc 1% Serum 30ml", "the-ordinary-niacinamide-zinc-serum", 6, 197, 45.00, 70,
     "beauty-the-ordinary-niacinamide.jpg", "photo-1598440947619-2c35fc9aa908",
     "High-strength vitamin and mineral blemish formula with 10% pure Niacinamide and 1% Zinc PCA. Regulates sebum production, minimizes enlarged pores, and visibly clears skin congestion."),
    
    (370, "Herbal Aloe Vera Facial Cleanser & Toner 100ml", "herbal-aloe-vera-facial-cleanser-toner", 6, 197, 29.00, 100,
     "beauty-aloe-vera-cleanser.jpg", "photo-1571781926291-c477ebfd024b",
     "Gentle alcohol-free facial wash and calming toner formulated with 99% pure organic aloe vera gel, cucumber extract, and tea tree oil. Purifies impurities while maintaining natural skin pH."),

    # --- Category 7: Footwear (8 products, all new) ---
    (None, "Nike Revolution 6 Next Nature Running Shoes — Men's", "nike-revolution-6-running-shoes", 7, 195, 89.00, 45,
     "footwear-nike-running-shoes.jpg", "photo-1542291026-7eec264c27ff",
     "Breathable engineered mesh upper made with at least 20% recycled materials. Soft foam midsole delivers a smooth stable ride, while computer-generated generative traction outsole grips road surfaces."),
    
    (None, "Puma Smash v2 Classic Leather Sneakers — Unisex", "puma-smash-v2-classic-leather-sneakers", 7, 195, 69.00, 60,
     "footwear-puma-classic-sneakers.jpg", "photo-1608231387042-66d1773070a5",
     "Tennis-inspired clean low-profile silhouette with soft leather upper and iconic Puma Formstrip. Features SoftFoam+ cushioned sockliner for supreme step-in comfort and durable gum rubber sole."),
    
    (None, "Woodland Men's Camel Brown Leather Casual Loafers", "woodland-camel-brown-leather-loafers", 7, 195, 85.00, 35,
     "footwear-woodland-leather-loafers.jpg", "photo-1533867617858-e7b97e060509",
     "Genuine nubuck leather slip-on boat shoes with hand-stitched moccasin toe detail. Heavy grooved rubber lug sole ensures non-slip traction on rugged urban and outdoor terrain."),
    
    (None, "Clarks Tilden Walk Formal Oxford Derby Shoes", "clarks-tilden-walk-formal-derby-shoes", 7, 195, 95.00, 30,
     "footwear-clarks-formal-derby.jpg", "photo-1614252235316-8c857d38b5f4",
     "Polished full-grain black leather formal lace-up shoes with square toe design. OrthoLite footbed with Cushion Soft technology absorbs impact for fatigue-free boardroom days."),
    
    (None, "Crocs Classic Unisex Lightweight Clogs", "crocs-classic-unisex-lightweight-clogs", 7, 195, 49.00, 75,
     "footwear-crocs-classic-clogs.jpg", "photo-1560769629-975ec94e6a86",
     "The iconic lightweight comfort clogs crafted from water-friendly Croslite foam. Ventilation ports shed water and debris, while pivoting heel straps provide a secure stay-on fit."),
    
    (None, "Bata Comfit Cushioned Walking Sandals — Men's", "bata-comfit-cushioned-walking-sandals", 7, 195, 39.00, 80,
     "footwear-bata-walking-sandals.jpg", "photo-1603808033192-082d6919d3e1",
     "Ergonomic everyday sandals with adjustable triple hook-and-loop velcro straps. High-density contoured EVA footbed with shock-absorbing arch support for relaxed everyday walking."),
    
    (None, "Women's Pointed Toe Block Heel Pumps — Nude Tan", "womens-pointed-toe-block-heel-pumps", 7, 195, 59.00, 50,
     "footwear-womens-block-heel-pumps.jpg", "photo-1543163521-1bf539c55dd2",
     "Sophisticated pointed-toe dress shoes featuring a sturdy 2.5-inch block heel, faux-suede upper, memory foam padded insole, and anti-slip rubber outsole for effortless chic style."),
    
    (None, "Sparx Breathable Slip-On Mesh Walking Shoes", "sparx-breathable-slip-on-walking-shoes", 7, 195, 35.00, 90,
     "footwear-sparx-slip-on-shoes.jpg", "photo-1595950653106-6c9ebd614d3a",
     "Ultra-lightweight sock-style knit sneaker with pull-on collar and padded heel counter. Flexible grooved phylon sole provides featherlight step bounce for gym, errands, and walking."),

    # --- Category 8: Watches (8 products, all new) ---
    (None, "Fossil Grant Chronograph Dark Brown Leather Watch", "fossil-grant-chronograph-leather-watch", 8, 198, 89.00, 40,
     "watches-fossil-chronograph-leather.jpg", "photo-1524805444758-089113d48a6d",
     "Vintage-inspired Roman numeral dial with 3 sub-dials for 24-hour, 30-minute, and 60-second stopwatch functions. 44mm stainless steel case with genuine supple dark brown leather strap."),
    
    (None, "Casio Vintage Digital Gold Mesh Strap Watch A168WG", "casio-vintage-digital-gold-mesh-watch", 8, 198, 49.00, 70,
     "watches-casio-vintage-gold.jpg", "photo-1522335789203-aabd1fc54bc9",
     "Retro classic digital timepiece with gold-tone stainless steel case and adjustable mesh bracelet. Features ElectroLuminescence backlight, 1/100s stopwatch, daily alarm, and auto-calendar."),
    
    (None, "Titan Workwear Silver Dial Analog Watch with Date", "titan-workwear-silver-dial-analog-watch", 8, 198, 65.00, 55,
     "watches-titan-workwear-analog.jpg", "photo-1523275335684-37898b6baf30",
     "Sophisticated sunray silver dial with sleek metallic indices and 3 o'clock date aperture. Solid stainless steel link bracelet with butterfly deployant clasp and 50m water resistance."),
    
    (None, "Timex Expedition Scout Rugged Military Field Watch", "timex-expedition-scout-field-watch", 8, 198, 55.00, 60,
     "watches-timex-expedition-scout.jpg", "photo-1533139502658-0198f920d8e8",
     "Outdoor military-inspired timepiece with durable black brass case, INDIGLO night-light dial, luminous hands, 24-hour military time markers, and durable ballistic nylon webbing strap."),
    
    (None, "Noise ColorFit Pulse 3 AMOLED Smartwatch 1.96-Inch", "noise-colorfit-pulse-3-smartwatch", 8, 194, 75.00, 50,
     "watches-noise-colorfit-pulse-smartwatch.jpg", "photo-1508685096489-7aacd43bd3b1",
     "Vibrant 1.96-inch curved AMOLED display with 500 nits brightness, Bluetooth single-chip calling, Tru Sync continuous heart rate & SpO2 tracking, and 100+ cloud watch faces."),
    
    (None, "Daniel Wellington Classic Sheffield Rose Gold Watch", "daniel-wellington-classic-sheffield-rose-gold", 8, 198, 79.00, 45,
     "watches-daniel-wellington-sheffield.jpg", "photo-1509042239860-f550ce710b93",
     "Ultra-thin 6mm rose gold plated case framing an eggshell white dial with minimalist baton hour markers. Interchangeable genuine Italian black leather band with buckle closure."),
    
    (None, "Fastrack Casual Analog Black Dial Silicone Watch", "fastrack-casual-analog-black-silicone-watch", 8, 198, 35.00, 85,
     "watches-fastrack-casual-analog.jpg", "photo-1539185441755-769473a23570",
     "Youthful sporty round watch with bold contrast hands and textured mineral glass. Sweat-resistant grooved silicone strap with sturdy buckle makes it a dependable everyday companion."),
    
    (None, "Amazfit Bip 5 Bluetooth Calling Fitness Smartwatch", "amazfit-bip-5-calling-fitness-smartwatch", 8, 194, 69.00, 55,
     "watches-amazfit-bip-5-smartwatch.jpg", "photo-1579586337278-3befd40fd17a",
     "Ultra-large 1.91-inch color touchscreen display with 4-satellite GPS positioning systems, 120+ sports workout modes, 10-day battery life, and Alexa voice assistant built right in."),

    # --- Category 9: Bags & Accessories (8 products, all new) ---
    (None, "Wildcraft 35L Water-Resistant Commuter Laptop Backpack", "wildcraft-35l-water-resistant-laptop-backpack", 9, 198, 69.00, 55,
     "bags-wildcraft-laptop-backpack.jpg", "photo-1553062407-98eeb64c6a62",
     "Multi-compartment 35-liter backpack crafted with abrasion-resistant polyester and water-repellent coating. Features padded 15.6-inch laptop sleeve and ergonomic airflow back padding."),
    
    (None, "Tommy Hilfiger Genuine Leather Bifold Wallet with RFID", "tommy-hilfiger-leather-bifold-wallet", 9, 198, 49.00, 75,
     "bags-tommy-leather-bifold-wallet.jpg", "photo-1627123424574-724758594e93",
     "Handcrafted 100% cowhide leather billfold wallet with embossed brand stripe. Equipped with RFID-blocking security lining, 6 card slots, 2 hidden slip pockets, and full currency divider."),
    
    (None, "Lavie Women's Structured Faux Leather Tote Handbag", "lavie-womens-structured-leather-tote", 9, 195, 65.00, 50,
     "bags-lavie-womens-tote-handbag.jpg", "photo-1584917865442-de89df76afd3",
     "Spacious shoulder tote with dual top carry handles and detachable adjustable crossbody strap. Premium saffiano textured PU leather with gold-tone hardware and central zippered divider."),
    
    (None, "Ray-Ban Aviator Classic Polarized Sunglasses RB3025", "ray-ban-aviator-classic-sunglasses", 9, 198, 89.00, 40,
     "bags-rayban-aviator-sunglasses.jpg", "photo-1511499767150-a48a237f0083",
     "The timeless teardrop pilot sunglasses featuring durable gold metal wire frame, crystal green polarized lenses offering 100% UV400 protection, and clear adjustable silicone nose pads."),
    
    (None, "Safari 45L Duffel Bag with Dedicated Shoe Pocket", "safari-45l-gym-duffel-shoe-pocket", 9, 198, 55.00, 60,
     "bags-safari-gym-duffel-shoe-pocket.jpg", "photo-1544816155-12df9643f363",
     "Lightweight tear-resistant nylon sports duffel bag with water-resistant bottom. Includes ventilated side zip shoe compartment, wet towel pouch, and detachable padded shoulder strap."),
    
    (None, "Spigen Minimalist Carbon Fiber Slim RFID Cardholder", "spigen-carbon-fiber-slim-rfid-cardholder", 9, 198, 35.00, 85,
     "bags-spigen-carbon-fiber-cardholder.jpg", "photo-1563245372-f21724e3856d",
     "Aviation-grade aluminum chassis wrapped in sleek woven carbon fiber plates. Elastic expandable webbing holds up to 12 cards without stretching, plus an integrated spring money clip."),
    
    (None, "Caprese Floral Print Zip-Around Travel Vanity Pouch", "caprese-floral-travel-vanity-pouch", 9, 195, 29.00, 90,
     "bags-caprese-floral-vanity-pouch.jpg", "photo-1544816155-12df9643f363",
     "Chic cosmetic organizer bag with waterproof wipe-clean lining, wide U-zip opening, interior brush elastic slots, and mesh accessory pocket. Perfect for toiletries and travel essentials."),
    
    (None, "Titan Stunner Matte Black Metal Buckle Reversible Leather Belt", "titan-stunner-reversible-leather-belt", 9, 198, 45.00, 70,
     "bags-titan-reversible-leather-belt.jpg", "photo-1553062407-98eeb64c6a62",
     "100% full-grain leather dress belt with a twistable swivel buckle mechanism for quick switching between formal black and casual rich brown. 35mm width with feather-edged stitching."),

    # --- Category 10: Mobile Accessories (7 products, all new) ---
    (None, "Spigen Ultra Hybrid Clear Case for iPhone 15 & 16", "spigen-ultra-hybrid-clear-case", 10, 194, 39.00, 90,
     "mobile-spigen-ultra-hybrid-case.jpg", "photo-1580910051074-3eb694886505",
     "Crystal-clear anti-yellowing polycarbonate back with shock-absorbing TPU bumper. Raised bezels protect screen and camera lens, while Air Cushion technology disperses drops."),
    
    (None, "Boat 65W GaN Dual USB-C & USB-A Fast Wall Charger", "boat-65w-gan-dual-fast-wall-charger", 10, 194, 59.00, 75,
     "mobile-boat-65w-gan-wall-charger.jpg", "photo-1583863788434-e58a36330cf0",
     "Next-generation Gallium Nitride power adapter providing PD 3.0 and QC 4.0 fast charging. Safely powers MacBooks, iPads, Galaxy devices, and iPhones with intelligent temperature control."),
    
    (None, "Portronics Braided 60W USB-C to USB-C Fast Cable 2m", "portronics-braided-60w-usb-c-cable-2m", 10, 194, 19.00, 100,
     "mobile-portronics-braided-usbc-cable.jpg", "photo-1585338107529-13afc5f02586",
     "Heavy-duty nylon braided cable tested to survive 20,000+ bends. Supports 60W Power Delivery rapid charging and high-speed 480 Mbps data sync with laser-welded aluminum alloy connectors."),
    
    (None, "Amkette Magnetic Dashboard & Windshield Car Phone Mount", "amkette-magnetic-dashboard-car-mount", 10, 194, 29.00, 80,
     "mobile-amkette-magnetic-car-mount.jpg", "photo-1584438784894-089d6a62b8fa",
     "Super-strong neodymium N52 rare-earth magnets hold phones firmly across potholes and sudden turns. Sticky suction gel pad attaches firmly to car dashboard or windshield with 360-degree ball joint."),
    
    (None, "Mi 10000mAh Pocket Power Bank 3i with 22.5W Fast Charge", "mi-10000mah-pocket-power-bank-3i", 10, 194, 69.00, 60,
     "mobile-mi-10000mah-power-bank.jpg", "photo-1609592424368-450ef77732d8",
     "Compact lithium polymer portable battery pack with dual input and triple output ports. Features 22.5W two-way fast charging, aluminum alloy casing, and 12-layer advanced circuit protection."),
    
    (None, "OpenSecret 9H Edge-to-Edge Tempered Glass Screen Protector", "opensecret-9h-tempered-glass-protector", 10, 194, 19.00, 100,
     "mobile-9h-tempered-glass-screen.jpg", "photo-1592899677977-9c10ca588bbd",
     "Military-grade shatterproof 9H tempered glass with oleophobic anti-fingerprint coating. 0.33mm ultra-thin high-transparency glass ensures 100% touch sensitivity and crystal-clear display."),
    
    (None, "Boult Audio ProBass Curve Neckband Bluetooth Earphones", "boult-audio-probass-curve-neckband", 10, 194, 49.00, 70,
     "mobile-boult-probass-curve-neckband.jpg", "photo-1590658268037-6bf12165a8df",
     "Flexible magnetic neckband earphones offering 30 hours of continuous playback and fast charging. Environmental Noise Cancellation mic and IPX5 sweat resistance for fitness workouts."),

    # --- Category 11: Home Decor (7 products, all new) ---
    (None, "Minimalist Ceramic Ribbed Flower Vase — Matte Off-White", "minimalist-ceramic-ribbed-flower-vase", 11, 196, 39.00, 60,
     "decor-ceramic-ribbed-flower-vase.jpg", "photo-1578749556568-bc2c40e68b61",
     "Nordic artisan handcrafted ceramic vase with tactile vertical ribbed detailing and matte unglazed stoneware texture. 20cm height perfect for dried pampas grass, fresh tulips, and dining tables."),
    
    (None, "Aromatherapy Natural Soy Wax Scented Candle in Amber Glass", "aromatherapy-natural-soy-scented-candle", 11, 196, 29.00, 85,
     "decor-aromatherapy-soy-scented-candle.jpg", "photo-1603006905003-be475563bc59",
     "Hand-poured 100% natural soy wax candle scented with calming lavender, French vanilla, and sandalwood essential oils. Cotton lead-free wick burns cleanly for up to 45 relaxing hours."),
    
    (None, "Warm White 10M LED Copper Wire Fairy String Lights", "warm-white-10m-fairy-string-lights", 11, 196, 19.00, 100,
     "decor-warm-white-fairy-string-lights.jpg", "photo-1513297887119-d46091b24bfa",
     "100 micro LED warm ambient starry lights along flexible bendable copper wire. USB-powered with low voltage heat-safe operation, ideal for bedroom headboards, indoor plants, and cozy photo walls."),
    
    (None, "Macrame Boho Wall Hanging Tapestry with Driftwood Rod", "macrame-boho-wall-hanging-tapestry", 11, 196, 45.00, 50,
     "decor-macrame-boho-wall-hanging.jpg", "photo-1513519245088-0e12902e5a38",
     "Intricately woven geometric bohemian macrame tapestry made from 100% unbleached natural cotton rope. Mounted on a polished natural wooden dowel to add cozy warmth and texture to living spaces."),
    
    (None, "Set of 3 Framed Botanical Canvas Wall Art Prints", "set-of-3-botanical-canvas-wall-art", 11, 196, 59.00, 45,
     "decor-botanical-canvas-wall-art.jpg", "photo-1579783900882-c0d3dad7b119",
     "Trio of minimalist botanical line-art canvas prints in Scandinavian neutral tones. Pre-framed in sturdy black composite frames with shatterproof acrylic glass, ready to hang with included brackets."),
    
    (None, "Moroccan Handcrafted Glass & Metal Tea-Light Lantern", "moroccan-handcrafted-glass-tea-light-lantern", 11, 196, 35.00, 65,
     "decor-moroccan-glass-lantern.jpg", "photo-1540932239986-30128078f3c5",
     "Vintage antique brass filigree lantern featuring stained amber and sapphire glass side panels. Casts enchanting decorative shadow patterns across patios, balconies, and festive dinner tables."),
    
    (None, "Modern Velvet Cushion Covers Set of 4 — Emerald Forest", "modern-velvet-cushion-covers-set-4", 11, 196, 49.00, 55,
     "decor-velvet-cushion-covers-emerald.jpg", "photo-1584100936595-c0654b55a2e2",
     "Set of four 16x16 inch plush Dutch velvet throw pillow covers in deep CodeChatura-inspired emerald green. Features concealed color-matched zippers and machine washable fade-resistant fabric."),

    # --- Category 12: Toys & Games (7 products, all new) ---
    (None, "Monopoly Deluxe Edition Board Game with Metal Tokens", "monopoly-deluxe-edition-board-game", 12, 198, 59.00, 50,
     "toys-monopoly-deluxe-board-game.jpg", "photo-1610890716171-6b1bb98ffd09",
     "The world's favorite family board game featuring premium wooden houses and hotels, heavyweight die-cast player tokens, gold foil title deed cards, and a nostalgic folding game board."),
    
    (None, "Rubik's Speed Cube 3x3 Magnetic Stickerless", "rubiks-speed-cube-3x3-magnetic", 12, 198, 25.00, 95,
     "toys-rubiks-speed-cube-3x3.jpg", "photo-1591994843349-f415893b3a6b",
     "Competition-ready 3x3 speed cube equipped with 48 factory-installed positioning magnets, anti-pop mechanism, adjustable spring tensioning, and frosted scratch-resistant bright plastic surfaces."),
    
    (None, "Magnetic 60-Piece 3D STEM Building Tiles Set", "magnetic-60-piece-3d-building-tiles", 12, 198, 69.00, 45,
     "toys-magnetic-3d-building-tiles.jpg", "photo-1587654780291-39c9404d746b",
     "Translucent rainbow magnetic geometric tiles made from BPA-free ABS plastic with rounded rivets. Encourages spatial reasoning, architectural creativity, and engineering exploration in children."),
    
    (None, "Handcrafted Wooden Chess Set with Folding Storage Board", "handcrafted-wooden-chess-set", 12, 198, 49.00, 60,
     "toys-handcrafted-wooden-chess-set.jpg", "photo-1529699211952-734e80c4d42b",
     "Artisan carved Staunton chess pieces crafted from Sheesham and Boxwood with felted bases. The 12-inch polished wooden board folds in half with velvet-lined interior cutouts for each piece."),
    
    (None, "Classic UNO Flip Double-Sided Card Game", "classic-uno-flip-card-game", 12, 198, 19.00, 100,
     "toys-uno-flip-card-game.jpg", "photo-1606167668584-78701c57f13d",
     "The thrilling twist on classic UNO with a double-sided deck containing Light and Dark sides. Special Flip cards trigger intense penalties like Draw 5 and Skip Everyone for endless family game night fun."),
    
    (None, "Catan Strategy Board Game — Base Game Edition", "catan-strategy-board-game-base", 12, 198, 79.00, 35,
     "toys-catan-strategy-board-game.jpg", "photo-1610890716171-6b1bb98ffd09",
     "Award-winning resource management and trading board game. Players harvest wool, grain, brick, lumber, and ore to build roads, settlements, and cities across the modular island of Catan."),
    
    (None, "Super Soft Plush Teddy Bear with Satin Bow — 30cm", "super-soft-plush-teddy-bear-30cm", 12, 198, 35.00, 75,
     "toys-plush-teddy-bear-satin-bow.jpg", "photo-1559454403-b8fb88521f11",
     "Ultra-huggable fluffy companion stuffed with 100% hypoallergenic PP cotton. Features safety-lock embroidered eyes, velvety soft honey-brown fur, and a stitched dark chocolate satin neck ribbon."),

    # --- Category 13: Grocery & Daily Essentials (7 products, all new) ---
    (None, "Happilo Premium California Roasted Almonds 500g", "happilo-premium-california-almonds-500g", 13, 197, 49.00, 70,
     "grocery-happilo-california-almonds.jpg", "photo-1508061252224-2375b48d9458",
     "100% authentic California Nonpareil whole almonds, slowly dry-roasted without artificial preservatives or oil. Rich in plant protein, dietary fiber, vitamin E, and heart-healthy antioxidants."),
    
    (None, "Organic India Tulsi Green Tea Leaves Tin 100g", "organic-india-tulsi-green-tea-100g", 13, 197, 29.00, 85,
     "grocery-organic-tulsi-green-tea.jpg", "photo-1576092768241-dec231879fc3",
     "Certified organic blend of Rama, Krishna, and Vana Tulsi herbs with premium whole leaf green tea. Boosts immunity, naturally relieves daily stress, and improves metabolic vitality."),
    
    (None, "Dabur 100% Pure Raw Forest Honey — Glass Jar 500g", "dabur-pure-raw-forest-honey-500g", 13, 197, 39.00, 80,
     "grocery-dabur-pure-raw-forest-honey.jpg", "photo-1587049352846-4a222e784d38",
     "Unadulterated raw forest honey tested for zero added sugar and full compliance with strict NMR purity standards. Natural sweet energy booster packed with essential enzymes and minerals."),
    
    (None, "True Elements Rolled Oats with Chia & Flax Seeds 1kg", "true-elements-rolled-oats-seeds-1kg", 13, 197, 35.00, 75,
     "grocery-true-elements-rolled-oats.jpg", "photo-1586444248902-2f64eddc13df",
     "100% whole grain jumbo rolled oats blended with raw chia seeds and crunchy golden flaxseeds. Powerhouse of soluble beta-glucan fiber and plant omega-3s for energized guilt-free breakfasts."),
    
    (None, "Patanjali Extra Virgin Cold Pressed Coconut Oil 500ml", "patanjali-cold-pressed-coconut-oil-500ml", 13, 197, 39.00, 90,
     "grocery-cold-pressed-coconut-oil.jpg", "photo-1526947425960-945c6e72858f",
     "Cold-extracted from fresh coconut milk without heat or chemical refining. Retains natural delicate aroma, medium-chain triglycerides (MCTs), and lauric acid for healthy cooking and skin nourishment."),
    
    (None, "Catch Himalayan Pink Rock Salt Fine Crystals 1kg", "catch-himalayan-pink-rock-salt-1kg", 13, 197, 19.00, 100,
     "grocery-himalayan-pink-rock-salt.jpg", "photo-1518110925495-5fe2fda0442c",
     "Pristine hand-mined Himalayan pink rock salt rich in 84 natural trace minerals including iron, calcium, and magnesium. Adds smooth, balanced seasoning to everyday dishes without chemical anti-caking agents."),
    
    (None, "Nescafe Gold Rich & Smooth Blend Instant Coffee 100g", "nescafe-gold-instant-coffee-100g", 13, 197, 45.00, 80,
     "grocery-nescafe-gold-instant-coffee.jpg", "photo-1514432324607-a09d9b4aefdd",
     "Mastercrafted with mountain-grown Arabica beans roasted to golden perfection. Delivers a sophisticated aroma, silky crema layer, and rich rounded coffee taste in every spoonful.")
]

def download_image(filename, unsplash_id):
    filepath = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(filepath) and os.path.getsize(filepath) > 5000:
        return True
    
    url = f"https://images.unsplash.com/{unsplash_id}?w=600&auto=format&fit=crop&q=80"
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=12) as response:
            data = response.read()
            with open(filepath, "wb") as f:
                f.write(data)
        return True
    except Exception as e:
        print(f"Warning: Failed to download {filename} from {unsplash_id}: {e}")
        # Try fallback Unsplash general product photo
        fallback_id = "photo-1523275335684-37898b6baf30"
        try:
            req = urllib.request.Request(f"https://images.unsplash.com/{fallback_id}?w=600&auto=format&fit=crop&q=80", headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=12) as response:
                data = response.read()
                with open(filepath, "wb") as f:
                    f.write(data)
            return True
        except Exception as e2:
            print(f"Fallback also failed for {filename}: {e2}")
            return False

def main():
    print("=== Starting SHOPIVO 100-Product Catalog Transformation ===")
    
    # Connect to PostgreSQL
    conn = psycopg2.connect("postgresql://postgres:MySecretPass123@localhost:5433/securecommerce")
    cur = conn.cursor()
    
    # 1. Update existing categories and insert new ones
    print("\n1. Synchronizing Categories...")
    for cat_id, name, slug, desc, active in CATEGORIES:
        cur.execute("SELECT id FROM categories WHERE id = %s;", (cat_id,))
        if cur.fetchone():
            cur.execute("""
                UPDATE categories 
                SET name = %s, slug = %s, description = %s, is_active = %s
                WHERE id = %s;
            """, (name, slug, desc, active, cat_id))
            print(f"  [UPDATED] Category {cat_id}: {name}")
        else:
            cur.execute("""
                INSERT INTO categories (id, name, slug, description, parent_id, is_active, created_at)
                VALUES (%s, %s, %s, %s, NULL, %s, NOW());
            """, (cat_id, name, slug, desc, active))
            print(f"  [INSERTED] Category {cat_id}: {name}")
    
    # Update categories sequence
    cur.execute("SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));")
    conn.commit()

    # 2. Download Images
    print(f"\n2. Downloading {len(PRODUCTS_DATA)} product images into {UPLOAD_DIR}...")
    success_downloads = 0
    for idx, item in enumerate(PRODUCTS_DATA, 1):
        filename = item[7]
        unsplash_id = item[8]
        ok = download_image(filename, unsplash_id)
        if ok:
            success_downloads += 1
        if idx % 10 == 0:
            print(f"  Processed {idx}/{len(PRODUCTS_DATA)} images ({success_downloads} successful)...")
    print(f"  Finished downloading images: {success_downloads}/{len(PRODUCTS_DATA)} ready.")

    # 3. Synchronize Products in Database
    print("\n3. Synchronizing Products in PostgreSQL...")
    updated_count = 0
    inserted_count = 0

    for item in PRODUCTS_DATA:
        p_id, name, slug, cat_id, seller_id, price, stock, filename, unsplash_id, desc = item
        image_url = f"/uploads/products/{filename}"
        
        if p_id is not None:
            # Update existing product
            cur.execute("""
                UPDATE products
                SET name = %s,
                    slug = %s,
                    category_id = %s,
                    seller_id = %s,
                    price = %s,
                    stock_quantity = %s,
                    image_url = %s,
                    description = %s,
                    status = 'APPROVED',
                    updated_at = NOW()
                WHERE id = %s;
            """, (name, slug, cat_id, seller_id, Decimal(str(price)), stock, image_url, desc, p_id))
            updated_count += 1
        else:
            # Insert new product
            cur.execute("""
                INSERT INTO products (
                    seller_id, category_id, name, slug, description,
                    price, stock_quantity, image_url, status,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, 'APPROVED',
                    NOW(), NOW()
                ) RETURNING id;
            """, (seller_id, cat_id, name, slug, desc, Decimal(str(price)), stock, image_url))
            new_id = cur.fetchone()[0]
            inserted_count += 1

    # Update products sequence
    cur.execute("SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));")
    conn.commit()

    print(f"\n  Products Updated: {updated_count}")
    print(f"  Products Inserted: {inserted_count}")
    print(f"  Total Catalog: {updated_count + inserted_count}")

    # 4. Run Audits & Verifications
    print("\n4. Running Database Catalog Verification...")
    
    cur.execute("SELECT count(*) FROM products;")
    total_p = cur.fetchone()[0]
    
    cur.execute("SELECT count(*) FROM products WHERE status = 'APPROVED';")
    approved_p = cur.fetchone()[0]
    
    cur.execute("SELECT count(*) FROM products WHERE price >= 100;")
    gte_100_p = cur.fetchone()[0]
    
    cur.execute("SELECT min(price), max(price), avg(price) FROM products;")
    min_p, max_p, avg_p = cur.fetchone()
    
    print(f"  Total Products in DB: {total_p}")
    print(f"  Approved Active Products: {approved_p}")
    print(f"  Products >= ₹100: {gte_100_p} (MUST BE 0)")
    print(f"  Price Range: Min = ₹{min_p}, Max = ₹{max_p}, Avg = ₹{avg_p:.2f}")

    print("\n  Products per Category:")
    cur.execute("""
        SELECT c.id, c.name, count(p.id)
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id, c.name
        ORDER BY c.id;
    """)
    for cid, cname, cnt in cur.fetchall():
        print(f"    Category {cid:2d} | {cname:<26} : {cnt} products")

    print("\n  Products per Seller:")
    cur.execute("""
        SELECT u.id, u.first_name, u.last_name, count(p.id)
        FROM users u
        LEFT JOIN products p ON u.id = p.seller_id
        WHERE u.role = 'SELLER'
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY u.id;
    """)
    for sid, fn, ln, cnt in cur.fetchall():
        print(f"    Seller {sid} | {fn} {ln:<15} : {cnt} products")

    conn.close()
    print("\n=== Marketplace Transformation Completed Successfully! ===")

if __name__ == "__main__":
    main()

