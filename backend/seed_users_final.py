from app import app, db, User, Turf
from werkzeug.security import generate_password_hash

def seed():
    with app.app_context():
        # Seed Admin
        if not User.query.filter_by(username='admin').first():
            print("Creating Admin...")
            admin = User(
                username='admin', 
                password_hash=generate_password_hash('admin123'), 
                role='admin', 
                name='Super Admin', 
                uid='ADMIN1'
            )
            db.session.add(admin)

        # Seed Owner
        if not User.query.filter_by(username='owner@turf.com').first():
            print("Creating Owner...")
            owner = User(
                username='owner@turf.com', 
                password_hash=generate_password_hash('owner123'), 
                role='owner', 
                name='Demo Owner', 
                uid='OWNER1'
            )
            db.session.add(owner)
            
        db.session.commit()
        print("Done. Users seeded.")
        print("Admin: admin / admin123")
        print("Owner: owner@turf.com / owner123")

if __name__ == '__main__':
    seed()
