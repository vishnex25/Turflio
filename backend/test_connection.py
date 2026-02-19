import pymysql
import os
from dotenv import load_dotenv

# Load key-value pairs from .env file
load_dotenv()

def test_connection():
    password = os.getenv('DB_PASSWORD')
    print(f"Testing connection configuration:")
    print(f"User: root")
    print(f"Host: localhost")
    print(f"Password provided: {'YES' if password else 'NO'}")
    
    # Attempt 1: As configured
    print("\n--- Attempt 1: Using .env configuration ---")
    try:
        conn = pymysql.connect(
            host='localhost',
            user='root',
            password=password
        )
        print("SUCCESS! Connected with provided configuration.")
        conn.close()
        return
    except Exception as e:
        print(f"Failed: {e}")

    # Attempt 2: No Password (common default)
    print("\n--- Attempt 2: Trying without password ---")
    try:
        conn = pymysql.connect(
            host='localhost',
            user='root',
            password=''
        )
        print("SUCCESS! Connected without password.")
        print("Action: Please clear the DB_PASSWORD in your .env file.")
        conn.close()
        return
    except Exception as e:
        print(f"Failed: {e}")

    # Attempt 3: 127.0.0.1 instead of localhost (networking issue)
    print("\n--- Attempt 3: Trying host 127.0.0.1 ---")
    try:
        conn = pymysql.connect(
            host='127.0.0.1',
            user='root',
            password=password
        )
        print("SUCCESS! Connected using 127.0.0.1.")
        print("Action: Please change DB_HOST to 127.0.0.1 in your .env file.")
        conn.close()
        return
    except Exception as e:
        print(f"Failed: {e}")

    print("\n\nAll automated attempts failed.")
    print("Please verify your MySQL password. You can reset it if you forgot it.")

if __name__ == "__main__":
    test_connection()
