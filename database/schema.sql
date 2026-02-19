CREATE DATABASE IF NOT EXISTS turn_app;
USE turn_app;

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS shared_payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS turfs;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'owner', 'admin') DEFAULT 'user',
    name VARCHAR(255),
    is_online BOOLEAN DEFAULT FALSE,
    uid VARCHAR(50) UNIQUE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE turfs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    amenities TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    image_url VARCHAR(500),
    sport_type VARCHAR(50) DEFAULT 'Cricket',
    owner_id INT,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turf_id INT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    booked_by INT NULL,
    FOREIGN KEY (turf_id) REFERENCES turfs(id) ON DELETE CASCADE,
    FOREIGN KEY (booked_by) REFERENCES users(id)
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    turf_id INT,
    slot_id INT, -- Generated or referenced
    game_id VARCHAR(50) UNIQUE, -- For game sharing
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    type ENUM('online', 'offline') DEFAULT 'online', -- To distinguish app bookings vs owner offline bookings
    booking_date DATE,
    start_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (turf_id) REFERENCES turfs(id)
);

CREATE TABLE shared_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    user_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE friends (
    user_id INT,
    friend_id INT,
    status ENUM('pending', 'accepted') DEFAULT 'pending',
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT,
    receiver_id INT NULL, 
    group_id INT NULL,    
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- Insert Default Super Admin
INSERT INTO users (username, password_hash, role, name) 
SELECT * FROM (SELECT 'admin', 'admin123', 'admin', 'Super Admin') AS tmp
WHERE NOT EXISTS (
    SELECT username FROM users WHERE username = 'admin'
) LIMIT 1;

-- Seed some Turfs for demo
INSERT INTO turfs (name, city, location, amenities, price, image_url) VALUES 
('Green Field Arena', 'Mumbai', 'Andheri West', 'Parking,Changing Room,Water,Floodlights', 1200.00, 'https://images.unsplash.com/photo-1529900748604-07564a03e7c3?auto=format&fit=crop&q=80&w=400'),
('Kickoff Turf', 'Mumbai', 'Bandra', 'Parking,Floodlights', 1500.00, 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=400'),
('PlayOn Sports', 'Pune', 'Viman Nagar', 'Water,Changing Room', 1000.00, 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=400');
