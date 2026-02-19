"""Add last_seen column to users table for heartbeat-based online detection."""
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

conn = pymysql.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    user=os.getenv('DB_USER', 'root'),
    password=os.getenv('DB_PASSWORD', 'root'),
    database=os.getenv('DB_NAME', 'turn_app')
)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE users ADD COLUMN last_seen DATETIME DEFAULT NULL")
    print("✅ Added last_seen column")
except Exception as e:
    if 'Duplicate column' in str(e):
        print("ℹ️  last_seen column already exists, skipping.")
    else:
        print(f"❌ Error: {e}")

# Set last_seen = NOW() for all currently online users so they don't immediately go offline
cursor.execute("UPDATE users SET last_seen = NOW() WHERE is_online = 1")
print(f"✅ Updated last_seen for online users")

conn.commit()
cursor.close()
conn.close()
print("Done.")
