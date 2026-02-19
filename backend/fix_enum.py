import pymysql, os
from dotenv import load_dotenv
load_dotenv()
conn = pymysql.connect(
    host=os.getenv('DB_HOST','localhost'),
    user=os.getenv('DB_USER','root'),
    password=os.getenv('DB_PASSWORD','root'),
    database=os.getenv('DB_NAME','turn_app')
)
cursor = conn.cursor()
cursor.execute("ALTER TABLE bookings MODIFY COLUMN type ENUM('online','offline','split') DEFAULT 'online'")
conn.commit()
print('ENUM updated OK')
conn.close()
