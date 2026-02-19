
from app import app, db, User
import random
import string
from sqlalchemy import text

def generate_uid():
    return ''.join(random.choices(string.digits, k=6))

with app.app_context():
    # 1. Add column if not exists
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN uid CHAR(6) UNIQUE DEFAULT NULL"))
            conn.commit()
            print("Added uid column")
    except Exception as e:
        print(f"Column might exist or error: {e}")

    # 2. Populate existing users
    users = User.query.filter(User.uid == None).all()
    count = 0
    for u in users:
        while True:
            new_uid = generate_uid()
            if not User.query.filter_by(uid=new_uid).first():
                u.uid = new_uid
                break
        count += 1
    
    db.session.commit()
    print(f"Updated {count} users with UIDs")
