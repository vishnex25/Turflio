from app import app, db, User
from sqlalchemy.exc import IntegrityError

def seed_users():
    with app.app_context():
        db.create_all()
        
        # Seed Admin
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            print("Seeding Admin...")
            admin = User(username='admin', password_hash='admin123', role='admin', name='Super Admin', uid='ADMIN1')
            db.session.add(admin)
        
        # Seed Owner
        owner = User.query.filter_by(username='owner@turf.com').first()
        if not owner:
            print("Seeding Owner...")
            owner = User(username='owner@turf.com', password_hash='owner123', role='owner', name='Demo Owner', uid='OWNER1')
            db.session.add(owner)
            
        try:
            db.session.commit()
            print("Seeding Complete.")
            print("Credentials:")
            print("Admin: admin / admin123")
            print("Owner: owner@turf.com / owner123")
        except Exception as e:
            db.session.rollback()
            print(f"Error seeding: {e}")

if __name__ == '__main__':
    seed_users()
