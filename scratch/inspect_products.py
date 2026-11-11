import psycopg2

conn = psycopg2.connect(
    dbname='securecommerce',
    user='postgres',
    password='MySecretPass123',
    host='localhost',
    port=5433
)
cur = conn.cursor()

cur.execute("""
SELECT p.id, p.name, p.price, p.category_id, c.name, p.image_url, p.status, p.stock_quantity, p.seller_id, SUBSTRING(p.description, 1, 60)
FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY p.id;
""")
products = cur.fetchall()
print(f"Existing Products ({len(products)}):")
for p in products:
    print(f"[{p[0]}] {p[1]} | ₹{p[2]} | {p[4]} | Stock: {p[7]} | Status: {p[6]} | Img: {p[5]}")

conn.close()

