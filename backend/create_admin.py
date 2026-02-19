from app import app, db, User
from sqlalchemy.exc import IntegrityError

with app.app_context():
    # Check if admin exists
    admin = User.query.filter_by(role='admin').first()
    if not admin:
        print("Creating admin account...")
        new_admin = User(
            username='admin', 
            password_hash='admin123', 
            role='admin', 
            name='Super Admin',
            uid='000000'
        )
        db.session.add(new_admin)
        try:
            db.session.commit()
            print("Admin created successfully: admin / admin123")
        except IntegrityError:
            db.session.rollback()
            print("Admin creation failed (might already exist).")
    else:
        print(f"Admin already exists: {admin.username}")
