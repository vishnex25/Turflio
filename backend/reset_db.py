from app import app, db
from sqlalchemy import text
import traceback

with app.app_context():
    try:
        print("Resetting database...")
        db.session.execute(text('SET FOREIGN_KEY_CHECKS = 0'))
        db.session.commit()
        db.drop_all()
        db.session.execute(text('SET FOREIGN_KEY_CHECKS = 1'))
        db.session.commit()
        
        print("Creating tables...")
        db.create_all()
        print("Database reset successfully.")
    except Exception as e:
        print(f"Error resetting database: {e}")
        traceback.print_exc()
