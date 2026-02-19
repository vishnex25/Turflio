from app import app, db, User
import traceback
from werkzeug.security import generate_password_hash

def simple_seed():
    with app.app_context():
        try:
            # Check if user exists
            user = User.query.filter_by(username='owner@turf.com').first()
            if user:
                print("User already exists. Updating password...")
                user.password_hash = generate_password_hash('owner123')
                db.session.commit()
                print("Password updated for 'owner@turf.com'.")
                return

            print("Creating user...")
            owner = User(
                username='owner@turf.com', 
                password_hash=generate_password_hash('owner123'), 
                role='owner', 
                name='Demo Owner', 
                uid='OWN123'
            )
            db.session.add(owner)
            db.session.commit()
            print("User 'owner@turf.com' created successfully.")
            
        except Exception:
            traceback.print_exc()

if __name__ == "__main__":
    simple_seed()
