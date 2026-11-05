import os, psycopg2

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
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
tables = [r[0] for r in cur.fetchall()]
print("All tables in public schema:", tables)

for t in tables:
    cur.execute(f"SELECT count(*) FROM {t}")
    print(f"{t}: {cur.fetchone()[0]}")

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments'")
print("\nPayments columns:", [c[0] for c in cur.fetchall()])

cur.execute("SELECT payment_status, payment_method, count(*) FROM payments GROUP BY payment_status, payment_method")
print("\nPayments group by status & method:", cur.fetchall())

cur.execute("SELECT installed_rank, version, description, script, success FROM flyway_schema_history ORDER BY installed_rank")
print("\nFlyway history:")
for r in cur.fetchall():
    print(f"Rank {r[0]}: version={r[1]}, description={r[2]}, script={r[3]}, success={r[4]}")
