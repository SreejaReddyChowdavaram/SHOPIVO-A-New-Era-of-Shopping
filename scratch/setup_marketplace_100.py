import os
import time
import urllib.request
import psycopg2

UPLOAD_DIR = r"c:\Users\SREEJA\Documents\Fraud Detection\secure-commerce-ai\backend\data\uploads\products"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 13 Categories Definition
CATEGORIES = [
    # (id, name, slug, description)
    (1, "Electronics", "electronics", "Premium consumer electronics, audio gear, computing and digital devices"),
    (2, "Clothing", "clothing", "Men and women casual, ethnic, formal, and seasonal apparel"),
    (3, "Books & Stationery", "books-stationery", "Bestselling books, academic literature, notebooks, and fine writing stationery"),
    (4, "Home & Kitchen", "home-kitchen", "Cookware, kitchen appliances, dining essentials, and storage solutions"),
    (5, "Sports & Fitness", "sports-fitness", "Fitness gear, outdoor sports equipment, activewear, and workout accessories"),
    (6, "Beauty & Personal Care", "beauty-personal-care", "Skincare, haircare, cosmetics, fragrances, and personal wellness essentials"),
    (7, "Footwear", "footwear", "Men and women casual sneakers, formal shoes, sports running shoes, and sandals"),
    (8, "Watches", "watches", "Classic analog watches, digital sports watches, minimalist leather timepieces, and chronographs"),
    (9, "Bags & Accessories", "bags-accessories", "Laptop backpacks, leather wallets, travel duffels, belts, and fashion accessories"),
    (10, "Mobile Accessories", "mobile-accessories", "Fast charging cables, wall adapters, phone cases, magnetic mounts, and mobile stands"),
    (11, "Home Decor", "home-decor", "Wall clocks, ceramic vases, scented candles, decorative lighting, and indoor planters"),
    (12, "Toys & Games", "toys-games", "Classic board games, wooden puzzles, Rubik cubes, card games, and construction sets"),
    (13, "Grocery & Daily Essentials", "grocery-daily-essentials", "Organic teas, artisan coffee beans, raw honey, gourmet chocolates, and daily pantry staples")
]

print("Category structure prepared with 13 categories.")

