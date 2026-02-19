from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename

from flask import send_from_directory

# Configure Uploads
# Move uploads outside 'backend' to prevent Flask reloader from restarting on file save
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

print(f"Upload Folder Configured at: {UPLOAD_FOLDER}")

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Database Configuration
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASSWORD', 'root')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'turn_app')

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('user', 'owner', 'admin'), default='user')
    name = db.Column(db.String(255))
    is_online = db.Column(db.Boolean, default=False)
    uid = db.Column(db.String(6), unique=True)
    is_banned = db.Column(db.Boolean, default=False)
    upi_id = db.Column(db.String(100))   # Owner's UPI ID for receiving payments
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)  # For real online detection
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    friends = db.relationship('Friend', foreign_keys='Friend.user_id', backref='user', lazy='dynamic')

class Turf(db.Model):
    __tablename__ = 'turfs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    sport_type = db.Column(db.String(50), default='Cricket')
    city = db.Column(db.String(255), nullable=False)
    location = db.Column(db.Text, nullable=False)
    amenities = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2))
    image_url = db.Column(db.String(500))
    status = db.Column(db.Enum('pending', 'approved', 'rejected'), default='approved')
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'))

class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    turf_id = db.Column(db.Integer, db.ForeignKey('turfs.id'))
    slot_id = db.Column(db.Integer)
    game_id = db.Column(db.String(50))
    total_amount = db.Column(db.Numeric(10, 2))
    advance_amount = db.Column(db.Numeric(10, 2))   # 20% paid by organiser
    num_players = db.Column(db.Integer, default=1)  # total players splitting cost
    status = db.Column(db.Enum('pending', 'confirmed', 'cancelled'), default='pending')
    type = db.Column(db.Enum('online', 'offline', 'split'), default='online')
    booking_date = db.Column(db.Date)
    start_time = db.Column(db.Time)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    turf = db.relationship('Turf')

class GamePayment(db.Model):
    """Tracks each friend's share payment for a split booking."""
    __tablename__ = 'game_payments'
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    player_name = db.Column(db.String(255), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # null if not registered
    amount_paid = db.Column(db.Numeric(10, 2), nullable=False)
    upi_ref = db.Column(db.String(100))   # UPI transaction reference
    paid_at = db.Column(db.DateTime, default=datetime.utcnow)

class Friend(db.Model):
    __tablename__ = 'friends'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    friend_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    status = db.Column(db.Enum('pending', 'accepted'), default='pending')

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now)
    is_read = db.Column(db.Boolean, default=False)   # Has the receiver read this?
    read_at = db.Column(db.DateTime, nullable=True)  # When they read it

class Announcement(db.Model):
    __tablename__ = 'announcements'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Rating(db.Model):
    __tablename__ = 'ratings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    turf_id = db.Column(db.Integer, db.ForeignKey('turfs.id'), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False, unique=True)
    stars = db.Column(db.Integer, nullable=False)  # 1-5
    review = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ROUTES

# ... (Auth routes remain same, see previous steps) ...
from werkzeug.security import check_password_hash

# ... (Auth routes remain same, see previous steps) ...
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password: 
        return jsonify({'error': 'Missing credentials'}), 400
        
    user = User.query.filter_by(username=username).first()
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
        
    if user.is_banned:
        return jsonify({'error': 'Account suspended. Contact support.'}), 403

    # Check password (supports both legacy plain text and new hashes)
    password_valid = False
    if user.password_hash.startswith('scrypt:') or user.password_hash.startswith('pbkdf2:'):
        password_valid = check_password_hash(user.password_hash, password)
    else:
        # Fallback for old plain text passwords (optional, but good for transition)
        password_valid = (user.password_hash == password)

    if password_valid:
        user.is_online = True
        user.last_seen = datetime.now()
        db.session.commit()
        return jsonify({
            'message': 'Login successful', 
            'user': {
                'id': user.id, 
                'username': user.username, 
                'name': user.name, 
                'role': user.role, 
                'uid': user.uid
            }
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    data = request.json
    user_id = data.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user:
            user.is_online = False
            user.last_seen = datetime.now()
            db.session.commit()
    return jsonify({'message': 'Logged out'})

@app.route('/api/users/<int:user_id>/heartbeat', methods=['POST'])
def heartbeat(user_id):
    """Called every 30s by the frontend to mark user as online."""
    user = User.query.get(user_id)
    if user:
        user.is_online = True
        user.last_seen = datetime.now()
        db.session.commit()
    return jsonify({'ok': True})

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    if not email or not password: return jsonify({'error': 'Missing data'}), 400
    
    # Generate UID
    import random, string
    while True:
        uid = ''.join(random.choices(string.digits, k=6))
        if not User.query.filter_by(uid=uid).first():
            break
            
    new_user = User(username=email, password_hash=password, role='user', name=name, uid=uid)
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created', 'user': {'username': email, 'role': 'user'}}), 201
    except IntegrityError as e:
        db.session.rollback()
        print(f"Signup IntegrityError: {e}")
        return jsonify({'error': 'User already exists'}), 409
    except Exception as e:
        db.session.rollback()
        print(f"Signup Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/add-owner', methods=['POST'])
def add_owner():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    name = data.get('name')
    new_owner = User(username=username, password_hash=password, role='owner', name=name)
    try:
        db.session.add(new_owner)
        db.session.commit()
        return jsonify({'message': 'Owner added'}), 201
    except IntegrityError:
        return jsonify({'error': 'Username taken'}), 409

@app.route('/api/admin/owners', methods=['GET'])
def get_owners():
    try:
        owners = User.query.filter_by(role='owner').all()
        return jsonify([{
            'id': u.id,
            'username': u.username,
            'name': u.name,
            'created_at': u.created_at.strftime('%Y-%m-%d') if hasattr(u, 'created_at') and u.created_at else ''
        } for u in owners])
    except Exception as e:
        print(f"Error getting owners: {e}")
        return jsonify([])
@app.route('/api/admin/owners/<int:id>', methods=['DELETE'])
def delete_owner(id):
    owner = User.query.get_or_404(id)
    if owner.role != 'owner':
        return jsonify({'error': 'User is not an owner'}), 400
    db.session.delete(owner)
    db.session.commit()
    return jsonify({'message': 'Owner deleted'})

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    try:
        total_users = User.query.filter_by(role='user').count()
        total_owners = User.query.filter_by(role='owner').count()
        total_turfs = Turf.query.count()
        total_bookings = Booking.query.count()
        pending_turfs = Turf.query.filter_by(status='pending').count()
        
        # Revenue (basic calc)
        revenue = db.session.query(func.sum(Booking.total_amount)).scalar()
        if revenue is None:
            revenue = 0
            
        return jsonify({
            'users': total_users,
            'owners': total_owners,
            'turfs': total_turfs,
            'bookings': total_bookings,
            'pending_turfs': pending_turfs,
            'revenue': float(revenue)
        })
    except Exception as e:
        print(f"Error in get_admin_stats: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    users = User.query.filter(User.role != 'admin').all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'name': u.name,
        'role': u.role,
        'is_banned': u.is_banned,
        'created_at': u.created_at.strftime('%Y-%m-%d') if hasattr(u, 'created_at') else ''
    } for u in users])

@app.route('/api/admin/users/<int:id>/ban', methods=['POST'])
def toggle_ban_user(id):
    user = User.query.get_or_404(id)
    user.is_banned = not user.is_banned
    db.session.commit()
    return jsonify({'message': f"User {'banned' if user.is_banned else 'unbanned'}", 'is_banned': user.is_banned})

@app.route('/api/admin/turfs', methods=['GET'])
def get_all_turfs_admin():
    turfs = Turf.query.all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'city': t.city,
        'owner_id': t.owner_id,
        'status': t.status,
        'price': float(t.price) if t.price else 0
    } for t in turfs])

@app.route('/api/admin/turfs/<int:id>/approve', methods=['POST'])
def approve_turf(id):
    turf = Turf.query.get_or_404(id)
    turf.status = 'approved'
    db.session.commit()
    return jsonify({'message': 'Turf approved'})

@app.route('/api/admin/announce', methods=['POST'])
def send_announcement():
    data = request.json
    content = data.get('message')
    if not content: return jsonify({'error': 'Empty message'}), 400
    
    # Store in DB
    ann = Announcement(content=content)
    db.session.add(ann)
    db.session.commit()
    
    return jsonify({'message': 'Announcement broadcasted'})

@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    anns = Announcement.query.order_by(Announcement.created_at.desc()).limit(5).all()
    return jsonify([{
        'id': a.id,
        'content': a.content,
        'created_at': a.created_at.strftime('%Y-%m-%d %H:%M')
    } for a in anns])
@app.route('/api/owner/bookings', methods=['GET'])
def get_owner_bookings():
    # In a real app, we'd filter by the current logged-in owner's ID
    # For now, we'll fetch all bookings for turfs owned by this user (passed via query param or auth token)
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify([])
    
    # Find turfs owned by this user
    my_turfs = Turf.query.filter_by(owner_id=user_id).all()
    turf_ids = [t.id for t in my_turfs]
    
    if not turf_ids:
        return jsonify([])

    bookings = Booking.query.filter(Booking.turf_id.in_(turf_ids)).order_by(Booking.booking_date.desc(), Booking.start_time).all()
    
    return jsonify([{
        'id': b.id,
        'turf_name': b.turf.name,
        'date': str(b.booking_date),
        'time': str(b.start_time),
        'status': b.status,
        'type': b.type,
        'amount': float(b.total_amount)
    } for b in bookings])

@app.route('/api/owner/turfs', methods=['GET'])
def get_owner_turfs():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify([])
    
    turfs = Turf.query.filter_by(owner_id=user_id).all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'sport_type': t.sport_type,
        'city': t.city,
        'location': t.location,
        'price': float(t.price) if t.price else 0,
        'image_url': t.image_url,
        'amenities': t.amenities
    } for t in turfs])

@app.route('/api/turfs/add', methods=['POST'])
def add_turf():
    # Debug logging
    with open("backend_debug.log", "a") as f:
        f.write(f"Received add_turf request at {datetime.now()}\n")
    
    try:
        data = request.form
        file = request.files.get('image')
        
        with open("backend_debug.log", "a") as f:
            f.write(f"Form data keys: {list(data.keys())}\n")
            f.write(f"File present: {file is not None}\n")

        owner_id = data.get('owner_id')
        price = data.get('price')
        
        if not owner_id or not price:
             return jsonify({'error': 'Missing owner_id or price'}), 400
             
        # Validate Owner Exists
        owner = User.query.get(owner_id)
        if not owner:
            return jsonify({'error': 'User session invalid. Please logout and login again.'}), 400

        image_url = ''
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{int(datetime.utcnow().timestamp())}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            
            with open("backend_debug.log", "a") as f:
                f.write(f"Saving file to {file_path}\n")
            
            file.save(file_path)
            
            with open("backend_debug.log", "a") as f:
                f.write("File saved successfully.\n")
                
            image_url = f"http://localhost:5000/uploads/{unique_filename}"

        with open("backend_debug.log", "a") as f:
            f.write("Creating DB Entry...\n")

        new_turf = Turf(
            name=data.get('name'),
            sport_type=data.get('sport_type', 'Cricket'),
            city=data.get('city'),
            location=data.get('location'),
            amenities=data.get('amenities'),
            price=float(price),
            image_url=image_url,
            owner_id=int(owner_id),
            status='approved'
        )
        db.session.add(new_turf)
        db.session.commit()
        
        with open("backend_debug.log", "a") as f:
            f.write(f"DB Entry created. ID: {new_turf.id}\n")
            
        return jsonify({'message': 'Turf added successfully', 'id': new_turf.id}), 201
    except ValueError as e:
        with open("backend_debug.log", "a") as f:
            f.write(f"ValueError: {e}\n")
        return jsonify({'error': f"Invalid data format: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        with open("backend_debug.log", "a") as f:
            f.write(f"Exception: {e}\n")
        print(f"Error adding turf: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/turfs/<int:turf_id>', methods=['PUT'])
def update_turf(turf_id):
    turf = Turf.query.get_or_404(turf_id)
    if request.content_type and 'multipart' in request.content_type:
        data = request.form
        file = request.files.get('image')
        owner_id = data.get('owner_id')
    else:
        data = request.json or {}
        file = None
        owner_id = data.get('owner_id')
    if not owner_id or int(owner_id) != turf.owner_id:
        return jsonify({'error': 'Unauthorized'}), 403
    turf.name = data.get('name', turf.name)
    turf.sport_type = data.get('sport_type', turf.sport_type)
    turf.city = data.get('city', turf.city)
    turf.location = data.get('location', turf.location)
    turf.amenities = data.get('amenities', turf.amenities)
    if data.get('price'):
        turf.price = float(data.get('price'))
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{int(datetime.utcnow().timestamp())}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        turf.image_url = f"http://localhost:5000/uploads/{unique_filename}"
    db.session.commit()
    return jsonify({'message': 'Turf updated successfully'})

@app.route('/api/turfs/<int:turf_id>', methods=['DELETE'])
def delete_turf(turf_id):
    turf = Turf.query.get_or_404(turf_id)
    data = request.json or {}
    owner_id = data.get('owner_id')
    if not owner_id or int(owner_id) != turf.owner_id:
        return jsonify({'error': 'Unauthorized'}), 403
    try:
        Booking.query.filter_by(turf_id=turf_id).delete()
        Rating.query.filter_by(turf_id=turf_id).delete()
        db.session.delete(turf)
        db.session.commit()
        return jsonify({'message': 'Turf deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/turfs', methods=['GET'])
def get_turfs():
    city = request.args.get('city')
    query = Turf.query
    if city:
        query = query.filter(Turf.city.ilike(f'%{city}%'))
    turfs = query.all()
    result = []
    for t in turfs:
        avg = db.session.query(func.avg(Rating.stars)).filter_by(turf_id=t.id).scalar()
        result.append({
            'id': t.id, 
            'name': t.name, 
            'sport_type': t.sport_type,
            'city': t.city,
            'location': t.location, 
            'amenities': t.amenities.split(',') if t.amenities else [],
            'price': float(t.price) if t.price else 0,
            'image_url': t.image_url,
            'avg_rating': round(float(avg), 1) if avg else None
        })
    return jsonify(result)

@app.route('/api/turfs/<int:id>', methods=['GET'])
def get_turf_details(id):
    t = Turf.query.get_or_404(id)
    avg = db.session.query(func.avg(Rating.stars)).filter_by(turf_id=t.id).scalar()
    return jsonify({
        'id': t.id, 
        'name': t.name, 
        'sport_type': t.sport_type,
        'city': t.city,
        'location': t.location, 
        'amenities': t.amenities.split(',') if t.amenities else [],
        'price': float(t.price) if t.price else 0,
        'image_url': t.image_url,
        'avg_rating': round(float(avg), 1) if avg else None
    })

@app.route('/api/turfs/<int:id>/slots', methods=['GET'])
def get_slots(id):
    date_str = request.args.get('date') # YYYY-MM-DD
    if not date_str:
        return jsonify([])
    
    # Generate static slots for now (e.g. 9 AM to 10 PM)
    slots = []
    base_time = datetime.strptime(date_str, '%Y-%m-%d')
    
    # Fetch existing bookings for this turf and date
    bookings = Booking.query.filter_by(turf_id=id, booking_date=date_str, status='confirmed').all()
    booked_times = [b.start_time.strftime('%H:%M') for b in bookings]

    for hour in range(9, 23): # 9 AM to 11 PM
        start_time = f"{hour:02d}:00"
        end_time = f"{hour+1:02d}:00"
        is_booked = start_time in booked_times
        slots.append({
            'id': hour, # Simple ID
            'time': f"{start_time} - {end_time}",
            'available': not is_booked,
            'start_raw': start_time
        })
    return jsonify(slots)

@app.route('/api/book', methods=['POST'])
def book_turf():
    data = request.json
    try:
        user_id = data.get('user_id')
        start_time = data.get('start_time', '00:00')
        total_amount = float(data.get('amount', 0))
        num_players = int(data.get('num_players', 1))
        payment_type = data.get('type', 'online')  # 'online' = full, 'split' = advance

        # Fetch username for game_id
        booker = User.query.get(user_id)
        username = booker.username.split('@')[0] if booker else 'player'

        # Format slot label e.g. "09AM" / "14PM"
        try:
            hour = int(start_time.split(':')[0])
            slot_label = f"{hour:02d}{'AM' if hour < 12 else 'PM'}"
        except:
            slot_label = start_time.replace(':', '')

        game_id = f"{username}-{slot_label}"

        # Advance = 20% of total for split bookings
        advance_amount = round(total_amount * 0.20, 2) if payment_type == 'split' else total_amount

        new_booking = Booking(
            user_id=user_id,
            turf_id=data.get('turf_id'),
            booking_date=data.get('date'),
            start_time=start_time,
            total_amount=total_amount,
            advance_amount=advance_amount,
            num_players=num_players,
            game_id=game_id,
            status='confirmed',
            type=payment_type
        )
        db.session.add(new_booking)
        db.session.flush()  # get new_booking.id before commit

        # Record organiser's own payment
        organiser_payment = GamePayment(
            booking_id=new_booking.id,
            player_name=booker.name or username,
            player_id=user_id,
            amount_paid=advance_amount,
            upi_ref='ORGANISER'
        )
        db.session.add(organiser_payment)
        db.session.commit()

        return jsonify({
            'message': 'Booking confirmed',
            'game_id': game_id,
            'booking_id': new_booking.id,
            'advance_paid': advance_amount,
            'share_per_player': round(total_amount / num_players, 2)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ── Public: fetch game details by game_id (for join link) ──────────────────
@app.route('/api/game/<game_id>', methods=['GET'])
def get_game_details(game_id):
    booking = Booking.query.filter_by(game_id=game_id).order_by(Booking.created_at.desc()).first()
    if not booking:
        return jsonify({'error': 'Game not found'}), 404

    turf = booking.turf
    organiser = User.query.get(booking.user_id)
    payments = GamePayment.query.filter_by(booking_id=booking.id).all()
    total = float(booking.total_amount)
    num_players = booking.num_players or 1
    share_per_player = round(total / num_players, 2)
    amount_collected = sum(float(p.amount_paid) for p in payments)
    remaining = round(total - amount_collected, 2)

    # Owner UPI details (stored on turf owner's user record if available)
    owner = User.query.get(turf.owner_id) if turf else None

    return jsonify({
        'game_id': game_id,
        'booking_id': booking.id,
        'turf_name': turf.name if turf else '',
        'turf_location': turf.location if turf else '',
        'date': str(booking.booking_date),
        'time': str(booking.start_time)[:5] if booking.start_time else '',
        'total_amount': total,
        'num_players': num_players,
        'share_per_player': share_per_player,
        'amount_collected': round(amount_collected, 2),
        'remaining': remaining,
        'organiser': organiser.name if organiser else 'Unknown',
        'owner_upi': owner.upi_id if owner and owner.upi_id else None,
        'payments': [{
            'player_name': p.player_name,
            'amount_paid': float(p.amount_paid),
            'upi_ref': p.upi_ref or '',
            'paid_at': p.paid_at.strftime('%H:%M') if p.paid_at else ''
        } for p in payments],
        'slots_filled': len(payments),
        'status': booking.status
    })

# ── Friend pays their share ────────────────────────────────────────────────
@app.route('/api/game/<game_id>/pay', methods=['POST'])
def pay_game_share(game_id):
    data = request.json
    booking = Booking.query.filter_by(game_id=game_id).order_by(Booking.created_at.desc()).first()
    if not booking:
        return jsonify({'error': 'Game not found'}), 404

    player_name = data.get('player_name', '').strip()
    upi_ref = data.get('upi_ref', '').strip()
    player_id = data.get('player_id')  # optional

    if not player_name:
        return jsonify({'error': 'Player name is required'}), 400
    if not upi_ref:
        return jsonify({'error': 'UPI Transaction ID is required to confirm payment'}), 400

    total = float(booking.total_amount)
    num_players = booking.num_players or 1
    share = round(total / num_players, 2)

    # Check if already paid (by name)
    existing = GamePayment.query.filter_by(booking_id=booking.id, player_name=player_name).first()
    if existing:
        return jsonify({'error': f'{player_name} has already paid their share'}), 409

    payment = GamePayment(
        booking_id=booking.id,
        player_name=player_name,
        player_id=player_id,
        amount_paid=share,
        upi_ref=upi_ref or None
    )
    db.session.add(payment)
    db.session.commit()

    payments = GamePayment.query.filter_by(booking_id=booking.id).all()
    amount_collected = sum(float(p.amount_paid) for p in payments)

    return jsonify({
        'message': f'Payment of ₹{share} recorded for {player_name}',
        'share_paid': share,
        'slots_filled': len(payments),
        'amount_collected': round(amount_collected, 2),
        'remaining': round(total - amount_collected, 2)
    }), 201

@app.route('/api/users/<int:id>', methods=['GET'])
def get_user_public(id):
    u = User.query.get_or_404(id)
    online_threshold = datetime.now() - timedelta(minutes=2)
    is_really_online = u.last_seen is not None and u.last_seen > online_threshold
    return jsonify({
        'id': u.id, 'name': u.name, 'uid': u.uid,
        'is_online': is_really_online,
        'upi_id': u.upi_id or ''
    })

@app.route('/api/users/<int:id>/upi', methods=['PATCH'])
def update_upi(id):
    data = request.json
    u = User.query.get_or_404(id)
    upi = data.get('upi_id', '').strip()
    u.upi_id = upi if upi else None
    db.session.commit()
    return jsonify({'message': 'UPI ID updated', 'upi_id': u.upi_id})


@app.route('/api/users/<int:user_id>/bookings', methods=['GET'])
def get_user_bookings(user_id):
    now = datetime.utcnow()
    bookings = Booking.query.filter_by(user_id=user_id).order_by(Booking.created_at.desc()).all()
    result = []
    for b in bookings:
        try:
            booking_end = datetime.combine(b.booking_date, b.start_time) + timedelta(hours=1)
            is_completed = booking_end < now
        except:
            is_completed = False
        existing_rating = Rating.query.filter_by(booking_id=b.id).first()
        result.append({
            'id': b.id,
            'turf_id': b.turf_id,
            'turf_name': b.turf.name,
            'date': str(b.booking_date),
            'time': str(b.start_time),
            'amount': float(b.total_amount),
            'status': b.status,
            'is_completed': is_completed,
            'rating': existing_rating.stars if existing_rating else None
        })
    return jsonify(result)

@app.route('/api/ratings', methods=['POST'])
def submit_rating():
    data = request.json
    user_id = data.get('user_id')
    turf_id = data.get('turf_id')
    booking_id = data.get('booking_id')
    stars = data.get('stars')
    review = data.get('review', '')
    if not all([user_id, turf_id, booking_id, stars]):
        return jsonify({'error': 'Missing required fields'}), 400
    if not (1 <= int(stars) <= 5):
        return jsonify({'error': 'Stars must be between 1 and 5'}), 400
    existing = Rating.query.filter_by(booking_id=booking_id).first()
    if existing:
        return jsonify({'error': 'Already rated'}), 409
    rating = Rating(
        user_id=int(user_id), turf_id=int(turf_id),
        booking_id=int(booking_id), stars=int(stars), review=review
    )
    db.session.add(rating)
    db.session.commit()
    return jsonify({'message': 'Rating submitted successfully'}), 201

@app.route('/api/users/<int:user_id>/friends', methods=['GET'])
def get_friends(user_id):
    friends_rel = Friend.query.filter(
        (Friend.user_id == user_id) | (Friend.friend_id == user_id),
        Friend.status == 'accepted'
    ).all()

    friend_ids = []
    for f in friends_rel:
        friend_ids.append(f.friend_id if f.user_id == user_id else f.user_id)

    friends = User.query.filter(User.id.in_(friend_ids)).all()

    online_threshold = datetime.now() - timedelta(minutes=2)
    results = []
    for u in friends:
        # Last message between user_id and this friend
        last_msg = Message.query.filter(
            ((Message.sender_id == user_id) & (Message.receiver_id == u.id)) |
            ((Message.sender_id == u.id) & (Message.receiver_id == user_id))
        ).order_by(Message.timestamp.desc()).first()

        # Unread = messages FROM friend that user hasn't read
        last_sent = Message.query.filter_by(sender_id=user_id, receiver_id=u.id).order_by(Message.timestamp.desc()).first()
        if last_sent:
            unread = Message.query.filter(
                Message.sender_id == u.id,
                Message.receiver_id == user_id,
                Message.timestamp > last_sent.timestamp
            ).count()
        else:
            unread = Message.query.filter_by(sender_id=u.id, receiver_id=user_id).count()

        # Real online: last_seen within 2 minutes (heartbeat-based)
        is_really_online = (
            u.last_seen is not None and u.last_seen > online_threshold
        )

        results.append({
            'id': u.id,
            'name': u.name,
            'uid': u.uid,
            'status': 'online' if is_really_online else 'offline',
            'is_online': is_really_online,
            'last_message': last_msg.content if last_msg else None,
            'last_message_time': last_msg.timestamp.strftime('%H:%M') if last_msg else None,
            'last_message_from_me': last_msg.sender_id == user_id if last_msg else None,
            'unread_count': unread
        })

    # Sort: friends with messages first, then by time desc
    results.sort(key=lambda x: (x['last_message'] is None, x['last_message_time'] or ''), reverse=False)
    results.sort(key=lambda x: x['last_message'] is None)
    return jsonify(results)

@app.route('/api/users/<int:user_id>/requests', methods=['get'])
def get_friend_requests(user_id):
    reqs = Friend.query.filter_by(friend_id=user_id, status='pending').all()
    senders = User.query.filter(User.id.in_([r.user_id for r in reqs])).all()
    return jsonify([{'id': u.id, 'name': u.name} for u in senders])

@app.route('/api/users/search', methods=['GET'])
def search_users():
    query = request.args.get('q', '').strip()
    if query:
        # Only regular users — no admins or owners
        users = User.query.filter(
            User.name.ilike(f'%{query}%'),
            User.role == 'user'
        ).limit(50).all()
    else:
        # Return all regular users (for "All People" tab)
        users = User.query.filter_by(role='user').limit(100).all()
    return jsonify([{'id': u.id, 'name': u.name, 'uid': u.uid} for u in users])

@app.route('/api/friends/request', methods=['POST'])
def send_friend_request():
    data = request.json
    try:
        new_friend = Friend(user_id=data['user_id'], friend_id=data['friend_id'], status='pending')
        db.session.add(new_friend)
        db.session.commit()
        return jsonify({'message': 'Request sent'})
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/friends/respond', methods=['POST'])
def respond_friend_request():
    data = request.json
    # Logic to accept
    req = Friend.query.filter_by(user_id=data['friend_id'], friend_id=data['user_id']).first()
    if req:
        req.status = 'accepted'
        db.session.commit()
    return jsonify({'message': 'Accepted'})

@app.route('/api/messages', methods=['GET'])
def get_messages():
    user_id = int(request.args.get('user_id', 0))
    friend_id = int(request.args.get('friend_id', 0))

    if not user_id or not friend_id:
        return jsonify([])

    # Auto-mark all messages FROM friend TO user as read (user is now viewing the chat)
    unread_msgs = Message.query.filter_by(
        sender_id=friend_id, receiver_id=user_id, is_read=False
    ).all()
    now = datetime.now()
    for m in unread_msgs:
        m.is_read = True
        m.read_at = now
    if unread_msgs:
        db.session.commit()

    # Fetch messages between these two users
    msgs = Message.query.filter(
        ((Message.sender_id == user_id) & (Message.receiver_id == friend_id)) |
        ((Message.sender_id == friend_id) & (Message.receiver_id == user_id))
    ).order_by(Message.timestamp).limit(100).all()

    results = []
    for m in msgs:
        sender = User.query.get(m.sender_id)
        results.append({
            'id': m.id,
            'text': m.content,
            'sender': sender.name if sender else 'Unknown',
            'sender_id': m.sender_id,
            'time': m.timestamp.strftime('%H:%M'),
            'date': m.timestamp.strftime('%Y-%m-%d'),
            'is_read': bool(m.is_read),
            'read_at': m.read_at.strftime('%H:%M') if m.read_at else None,
        })
    return jsonify(results)

@app.route('/api/messages/read', methods=['POST'])
def mark_messages_read():
    """Explicitly mark all messages from friend_id to user_id as read."""
    data = request.json
    user_id = data.get('user_id')
    friend_id = data.get('friend_id')
    if not user_id or not friend_id:
        return jsonify({'error': 'Missing params'}), 400
    now = datetime.now()
    updated = Message.query.filter_by(
        sender_id=friend_id, receiver_id=user_id, is_read=False
    ).all()
    for m in updated:
        m.is_read = True
        m.read_at = now
    db.session.commit()
    return jsonify({'marked_read': len(updated)})

@app.route('/api/messages', methods=['POST'])
def send_message():
    data = request.json
    msg = Message(sender_id=data['user_id'], receiver_id=data.get('friend_id'), content=data['text'])
    db.session.add(msg)
    db.session.commit()
    return jsonify({'message': 'Sent', 'id': msg.id})

if __name__ == '__main__':
    with app.app_context():
        # db.create_all()
        pass
    app.run(debug=True, port=5000)
