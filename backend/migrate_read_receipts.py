"""Add is_read and read_at columns to messages table for read receipts."""
import pymysql, os
from dotenv import load_dotenv
load_dotenv()

conn = pymysql.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    user=os.getenv('DB_USER', 'root'),
    password=os.getenv('DB_PASSWORD', 'root'),
    database=os.getenv('DB_NAME', 'turn_app')
)
cur = conn.cursor()

for sql, label in [
    ("ALTER TABLE messages ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0", "is_read"),
    ("ALTER TABLE messages ADD COLUMN read_at DATETIME DEFAULT NULL", "read_at"),
]:
    try:
        cur.execute(sql)
        print(f"✅ Added column: {label}")
    except Exception as e:
        if 'Duplicate column' in str(e):
            print(f"ℹ️  {label} already exists, skipping.")
        else:
            print(f"❌ {label}: {e}")

conn.commit()
cur.close()
conn.close()
print("Done.")
