import psycopg2

env = {}
with open(r"C:\Users\SREEJA\Documents\Fraud Detection\secure-commerce-ai\backend\.env") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()

conn = psycopg2.connect(
    dbname="securecommerce",
    user=env.get("DB_USERNAME", "postgres"),
    password=env.get("DB_PASSWORD", ""),
    host="localhost",
    port=5433
)
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
print("User columns:", [r[0] for r in cur.fetchall()])
cur.execute("SELECT * FROM users WHERE role = 'ADMIN'")
print("\nAdmin user:", cur.fetchall())
cur.execute("SELECT id, email, first_name, last_name, role, is_active FROM users WHERE role = 'SELLER' ORDER BY id")
print("\nSellers:")
for s in cur.fetchall():
    print(s)
