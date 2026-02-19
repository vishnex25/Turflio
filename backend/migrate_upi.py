"""Add upi_id column to users table for owner payment details."""
import pymysql, os
from dotenv import load_dotenv
load_dotenv()

conn = pymysql.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    user=os.getenv('DB_USER', 'root'),
    password=os.getenv('DB_PASSWORD', 'root'),
    database=os.getenv('DB_NAME', 'turn_app')
)
cursor = conn.cursor()

def col_exists(table, col):
    cursor.execute(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s AND COLUMN_NAME=%s",
        (table, col)
    )
    return cursor.fetchone()[0] > 0

if not col_exists('users', 'upi_id'):
    cursor.execute("ALTER TABLE users ADD COLUMN upi_id VARCHAR(100) DEFAULT NULL")
    print("Added: users.upi_id")
else:
    print("Skip: users.upi_id already exists")

conn.commit()
cursor.close()
conn.close()
print("Done.")
