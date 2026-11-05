#!/usr/bin/env python3
"""
export_research_datasets.py
===========================
Semester 1 Research Data Foundation: Extraction Script

Extracts structured relational datasets and persistent event logs from PostgreSQL
into CSV format for future Semester 2 feature engineering and ML training.

Datasets exported:
- events.csv
- orders.csv
- payments.csv
- users.csv
- returns.csv
- refunds.csv
- reviews.csv

Usage:
    python scripts/export_research_datasets.py --output-dir ./research_data
    python scripts/export_research_datasets.py --api-url http://localhost:8080/api --admin-token <JWT>
"""

import os
import sys
import argparse
import csv

def export_via_postgres(db_url, output_dir):
    try:
        import psycopg2
    except ImportError:
        print("[!] psycopg2 not installed. Run: pip install psycopg2-binary")
        return False

    print(f"[*] Connecting to PostgreSQL: {db_url}")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
    except Exception as e:
        print(f"[-] Connection failed: {e}")
        return False

    queries = {
        "events.csv": """
            SELECT id, user_id, event_type, event_timestamp, session_id,
                   reference_type, reference_id, ip_address, user_agent, metadata, created_at
            FROM user_events ORDER BY event_timestamp ASC;
        """,
        "orders.csv": """
            SELECT id, customer_id, status, total_amount, payment_expires_at,
                   shipping_city, shipping_country, created_at
            FROM orders ORDER BY created_at ASC;
        """,
        "payments.csv": """
            SELECT id, order_id, customer_id, provider, payment_method, payment_status,
                   amount, transaction_id, gateway_method, card_last4, failure_reason, created_at
            FROM payments ORDER BY created_at ASC;
        """,
        "users.csv": """
            SELECT id, email, first_name, last_name, role, enabled, created_at
            FROM users ORDER BY created_at ASC;
        """,
        "returns.csv": """
            SELECT id, order_id, customer_id, status, refund_amount, reason, created_at
            FROM return_requests ORDER BY created_at ASC;
        """,
        "refunds.csv": """
            SELECT id, order_id, customer_id, refund_status, refund_amount,
                   refund_transaction_id, payment_method, processed_at
            FROM refunds ORDER BY created_at ASC;
        """,
        "reviews.csv": """
            SELECT id, product_id, customer_id, order_id, rating, verified_purchase, created_at
            FROM reviews ORDER BY created_at ASC;
        """
    }

    os.makedirs(output_dir, exist_ok=True)

    for filename, query in queries.items():
        filepath = os.path.join(output_dir, filename)
        print(f"[*] Exporting {filename} ...")
        try:
            cur.execute(query)
            rows = cur.fetchall()
            headers = [desc[0] for desc in cur.description]
            with open(filepath, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(headers)
                writer.writerows(rows)
            print(f"    [+] Saved {len(rows)} records to {filepath}")
        except Exception as e:
            print(f"    [-] Failed to export {filename}: {e}")

    cur.close()
    conn.close()
    print(f"\n[+] Research datasets successfully exported to {output_dir}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Export Shopivo Research Datasets")
    parser.add_argument("--output-dir", default="./research_data", help="Target directory for CSV exports")
    parser.add_argument("--db-url", default=os.getenv("DB_URL", "postgresql://postgres:postgres@localhost:5432/securecommerce"),
                        help="PostgreSQL connection string")
    args = parser.parse_args()

    success = export_via_postgres(args.db_url, args.output_dir)
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
