import psycopg2

conn = psycopg2.connect(
    dbname='securecommerce',
    user='postgres',
    password='MySecretPass123',
    host='localhost',
    port=5433
)
cur = conn.cursor()

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';")
print("User columns:")
for col in cur.fetchall():
    print(f"  {col[0]} ({col[1]})")

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';")
print("\nProduct columns:")
for col in cur.fetchall():
    print(f"  {col[0]} ({col[1]})")

cur.execute("SELECT u.id, u.first_name, u.last_name, u.email, u.role FROM users u WHERE u.role = 'SELLER';")
sellers = cur.fetchall()
print(f"\nSellers ({len(sellers)}):")
for s in sellers:
    print(f"  ID: {s[0]}, Name: {s[1]} {s[2]}, Email: {s[3]}, Role: {s[4]}")

conn.close()
