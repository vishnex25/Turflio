
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'turn_app')

def run_migration():
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME)
        cursor = conn.cursor()
        
        # Add is_banned to users
        try:
            print("Adding is_banned to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE")
            print("Success.")
        except pymysql.MySQLError as e:
            if e.args[0] == 1060: # Duplicate column name
                print("Column is_banned already exists.")
            else:
                print(f"Error adding is_banned: {e}")

        # Add status to turfs
        try:
            print("Adding status to turfs table...")
            cursor.execute("ALTER TABLE turfs ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'") # Default approved for existing
            print("Success.")
        except pymysql.MySQLError as e:
            if e.args[0] == 1060:
                print("Column status already exists.")
            else:
                print(f"Error adding status: {e}")

        conn.commit()
        conn.close()
        print("Migration complete!")
        
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
