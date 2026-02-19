"""
Migration: Add split-payment columns to bookings + create game_payments table.
Run once: python migrate_split_payment.py
"""
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

conn = pymysql.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    user=os.getenv('DB_USER', 'root'),
    password=os.getenv('DB_PASSWORD', 'root'),
    database=os.getenv('DB_NAME', 'turn_app'),
    charset='utf8mb4'
)
cursor = conn.cursor()

def column_exists(table, column):
    cursor.execute(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s",
        (table, column)
    )
    return cursor.fetchone()[0] > 0

# 1. Add advance_amount to bookings
if not column_exists('bookings', 'advance_amount'):
    cursor.execute("ALTER TABLE bookings ADD COLUMN advance_amount DECIMAL(10,2) DEFAULT NULL AFTER total_amount")
    print("Added: bookings.advance_amount")
else:
    print("Skip: bookings.advance_amount already exists")

# 2. Add num_players to bookings
if not column_exists('bookings', 'num_players'):
    cursor.execute("ALTER TABLE bookings ADD COLUMN num_players INT DEFAULT 1 AFTER advance_amount")
    print("Added: bookings.num_players")
else:
    print("Skip: bookings.num_players already exists")

# 3. Create game_payments table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS game_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        player_name VARCHAR(255) NOT NULL,
        player_id INT DEFAULT NULL,
        amount_paid DECIMAL(10,2) NOT NULL,
        upi_ref VARCHAR(100) DEFAULT NULL,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE SET NULL
    )
""")
print("OK: game_payments table ready")

conn.commit()
cursor.close()
conn.close()
print("\nMigration complete.")
