import pymysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database Configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASSWORD', 'root')
DB_NAME = os.getenv('DB_NAME', 'turn_app')

def init_db():
    conn = None
    try:
        # Connect to MySQL Server (connect to sys/default first to create DB)
        print(f"Connecting to MySQL as {DB_USER}...")
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS)
        cursor = conn.cursor()
        
        # Read schema file
        schema_path = os.path.join(os.path.dirname(__file__), '../database/schema.sql')
        with open(schema_path, 'r') as f:
            schema = f.read()
        
        # Execute schema commands
        commands = schema.split(';')
        for command in commands:
            if command.strip():
                try:
                    cursor.execute(command)
                except Exception as e:
                    print(f"Warning executing command: {e}")
        
        conn.commit()
        print("Database initialized successfully!")
        
    except pymysql.MySQLError as e:
        print(f"Database Error: {e}")
        print("Please check your database credentials in the .env file.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    init_db()
