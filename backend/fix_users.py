from app import app, db, User
from werkzeug.security import generate_password_hash
import sys

def fix_users():
    with app.app_context():
        try:
            print("Starting user fix/seed with FULL RESET...")
            # Use SQLAlchemy to reset schema to match models exactly
            db.drop_all()
            db.create_all()
            print("Database schema reset via SQLAlchemy.")
            
            # 1. Fix/Create Super Admin
            admin = User.query.filter_by(username='admin').first()
            if admin:
                print("Found existing 'admin' user. Updating password...")
                admin.password_hash = generate_password_hash('admin123')
                admin.role = 'admin' # Ensure role is correct
            else:
                print("Creating 'admin' user...")
                admin = User(
                    username='admin',
                    password_hash=generate_password_hash('admin123'),
                    role='admin',
                    name='Super Admin',
                    uid='ADMIN01'
                )
                db.session.add(admin)
            
            # 2. Fix/Create Owner
            owner = User.query.filter_by(username='owner@turf.com').first()
            if owner:
                print("Found existing 'owner@turf.com' user. Updating password...")
                owner.password_hash = generate_password_hash('owner123')
                owner.role = 'owner' # Ensure role is correct
            else:
                print("Creating 'owner@turf.com' user...")
                owner = User(
                    username='owner@turf.com',
                    password_hash=generate_password_hash('owner123'),
                    role='owner',
                    name='Demo Owner',
                    uid='OWNER01'
                )
                db.session.add(owner)

            db.session.commit()
            print("\nSUCCESS! Users updated.")
            print("-" * 30)
            print("SUPER ADMIN -> Username: admin          Password: admin123")
            print("TURF OWNER  -> Username: owner@turf.com Password: owner123")
            print("-" * 30)

        except Exception as e:
            db.session.rollback()
            print(f"\nERROR: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    fix_users()
