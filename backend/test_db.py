from app import app, db
import sys

def test_db():
    with app.app_context():
        try:
            print("Testing DB connection...")
            db.engine.connect()
            print("Connection SUCCESS!")
        except Exception as e:
            print(f"Connection FAILED: {e}")

if __name__ == "__main__":
    test_db()
