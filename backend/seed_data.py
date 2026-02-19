from app import app, db, Announcement

with app.app_context():
    if Announcement.query.count() == 0:
        print("Adding welcome announcement...")
        ann = Announcement(content="Welcome to the new Turf Booking System! 🚀")
        db.session.add(ann)
        db.session.commit()
