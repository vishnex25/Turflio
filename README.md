# Turf Booking Application

## Features
- **City-Based Search**: Find turfs by city.
- **Booking System**: Book slots and split payments with friends.
- **Offline Sync**: Owners can adding offline bookings.
- **Friends & Chat**: Social features for teams.

## Tech Stack
- **Frontend**: React, Vite
- **Backend**: Flask
- **Database**: MySQL

## Setup Instructions

### Backend
1. Navigate to `backend` folder.
2. Create virtual environment:
   ```sh
   python -m venv venv
   .\venv\Scripts\Activate
   ```
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Setup Database:
   - Ensure MySQL is running.
   - Update database credentials in `app.py` and `init_db.py`.
   - Run initialization:
     ```sh
     python init_db.py
     ```
5. Run Server:
   ```sh
   python app.py
   ```

### Frontend
1. Navigate to `frontend` folder.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run Development Server:
   ```sh
   npm run dev
   ```

## Mobile View
Open the browser developer tools and toggle device toolbar to view as a mobile application.
