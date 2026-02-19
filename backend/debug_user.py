
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'turn_app')

def check_users():
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME)
        cursor = conn.cursor()
        
        print("Checking 'users' table...")
        cursor.execute("SELECT id, username, password_hash, role FROM users")
        users = cursor.fetchall()
        
        if not users:
            print("No users found in the database.")
        else:
            print(f"Found {len(users)} user(s):")
            for u in users:
                print(f"ID: {u[0]}, Username: {u[1]}, Password: {u[2]}, Role: {u[3]}")
                
        conn.close()
    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    check_users()
