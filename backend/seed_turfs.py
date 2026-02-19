from app import app, db, Turf, User

def seed_turfs():
    with app.app_context():
        owner = User.query.filter_by(role='owner').first()
        if not owner:
            print("No owner found. Please seed users first.")
            return

        if Turf.query.count() > 0:
            print("Turfs already exist.")
            return

        print("Seeding turfs...")
        turfs = [
            Turf(
                name='Green Field Arena', 
                city='Mumbai', 
                location='Andheri West', 
                amenities='Parking,Changing Room,Water,Floodlights', 
                price=1200.00, 
                image_url='https://images.unsplash.com/photo-1529900748604-07564a03e7c3?auto=format&fit=crop&q=80&w=400',
                sport_type='Cricket',
                owner_id=owner.id,
                status='approved'
            ),
            Turf(
                name='Kickoff Turf', 
                city='Mumbai', 
                location='Bandra', 
                amenities='Parking,Floodlights', 
                price=1500.00, 
                image_url='https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=400',
                sport_type='Football',
                owner_id=owner.id,
                status='approved'
            ),
            Turf(
                name='PlayOn Sports', 
                city='Pune', 
                location='Viman Nagar', 
                amenities='Water,Changing Room', 
                price=1000.00, 
                image_url='https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=400',
                sport_type='Tennis',
                owner_id=owner.id,
                status='approved'
            )
        ]

        for t in turfs:
            db.session.add(t)
        
        db.session.commit()
        print("Turfs seeded successfully!")

if __name__ == "__main__":
    seed_turfs()
