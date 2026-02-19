from app import app, db, User

with app.app_context():
    users = User.query.all()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"User: {u.username}, Role: {u.role}, Password: {u.password_hash}")
