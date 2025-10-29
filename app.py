import sqlite3
import time
from flask import Flask, jsonify, request, g, session, redirect, render_template
from flask_bcrypt import Bcrypt

# --- Flask App Setup ---
app = Flask(__name__)
# A secret key is required for sessions
app.config['SECRET_KEY'] = 'your_very_secret_key_change_this_later'
bcrypt = Bcrypt(app)
DATABASE = 'civicquest.db'

# --- Database Setup & Helpers ---

def get_db():
    """Get a connection to the SQLite database."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        # Return rows as dictionaries
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    """Close the database connection at the end of the request."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """Initialize the database and create tables if they don't exist."""
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        # --- Create users table ---
        cursor.execute(
            '''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                high_score INTEGER DEFAULT 0
            )
            '''
        )
        
        # --- Create issues table (if it wasn't created in the old version) ---
        cursor.execute(
            '''
            CREATE TABLE IF NOT EXISTS issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                location TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL,
                photoUrl TEXT,
                createdAt INTEGER NOT NULL,
                user_id INTEGER,
                username TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
            '''
        )

        # --- Update issues table (if needed) ---
        try:
            # Try to add user_id and username columns (for migrating old DBs)
            cursor.execute('ALTER TABLE issues ADD COLUMN user_id INTEGER')
            cursor.execute('ALTER TABLE issues ADD COLUMN username TEXT')
            print("Issues table updated for user tracking.")
        except sqlite3.OperationalError as e:
            # This will fail if the columns already exist, which is fine
            if "duplicate column name" not in str(e):
                # If it's a different error, just print it
                print(f"DB init info: {e}")
                pass
        
        db.commit()
        print("Database initialized/updated.")

# --- API Endpoints (Auth) ---

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    db = get_db()
    cursor = db.cursor()
    
    # Check if user already exists
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    if cursor.fetchone():
        return jsonify({'error': 'Username already taken'}), 409

    # Hash password and create user
    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    cursor.execute(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        (username, password_hash)
    )
    user_id = cursor.lastrowid
    db.commit()

    # Log the user in
    session['user_id'] = user_id
    session['username'] = username
    
    return jsonify({
        'id': user_id,
        'username': username,
        'high_score': 0
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()

    if user and bcrypt.check_password_hash(user['password_hash'], password):
        # User is valid, set session
        session['user_id'] = user['id']
        session['username'] = user['username']
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'high_score': user['high_score']
        }), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/me', methods=['GET'])
def get_current_user():
    """Get the currently logged-in user's details."""
    if 'user_id' in session:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT id, username, high_score FROM users WHERE id = ?', (session['user_id'],))
        user = cursor.fetchone()
        if user:
            return jsonify(dict(user)), 200
    
    return jsonify({'error': 'Not authenticated'}), 401

# --- API Endpoints (Core App) ---

@app.route('/api/issues', methods=['GET'])
def get_issues():
    """API endpoint to get all issues, newest first."""
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT * FROM issues ORDER BY createdAt DESC')
    issues = [dict(row) for row in cursor.fetchall()]
    return jsonify(issues)

@app.route('/api/report', methods=['POST'])
def report_issue():
    """API endpoint to submit a new issue. REQUIRES LOGIN."""
    if 'user_id' not in session:
        return jsonify({'error': 'Please log in to report an issue'}), 401

    data = request.form

    if not data or not data.get('type') or not data.get('location') or not data.get('description'):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            '''
            INSERT INTO issues (type, location, description, status, photoUrl, createdAt, user_id, username)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                data['type'],
                data['location'],
                data['description'],
                'Reported', # Default status
                data.get('photoUrl', 'No photo'),
                int(time.time()), # Use a simple timestamp
                session['user_id'],
                session['username']
            )
        )
        db.commit()

        return jsonify({'message': 'Issue reported successfully!', 'points': 10}), 201

    except Exception as e:
        print(f"Error reporting issue: {e}")
        return jsonify({'error': 'Failed to report issue'}), 500

@app.route('/api/score', methods=['POST'])
def update_score():
    """API endpoint to update the user's high score. REQUIRES LOGIN."""
    if 'user_id' not in session:
        return jsonify({'error': 'Please log in to save your score'}), 401
        
    data = request.get_json()
    new_score = data.get('score')
    
    if new_score is None:
        return jsonify({'error': 'Score is required'}), 400

    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get current high score
        cursor.execute('SELECT high_score FROM users WHERE id = ?', (session['user_id'],))
        user = cursor.fetchone()
        current_high_score = user['high_score']
        
        if new_score > current_high_score:
            # Update high score
            cursor.execute(
                'UPDATE users SET high_score = ? WHERE id = ?',
                (new_score, session['user_id'])
            )
            db.commit()
            return jsonify({'message': 'New high score saved!', 'high_score': new_score}), 200
        else:
            return jsonify({'message': 'Score not higher than existing high score.', 'high_score': current_high_score}), 200

    except Exception as e:
        print(f"Error updating score: {e}")
        return jsonify({'error': 'Failed to update score'}), 500


# --- NEW LEADERBOARD ENDPOINT ---
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Fetches the top 10 users by high score."""
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get top 10 users, ordered by their high score
        cursor.execute(
            'SELECT username, high_score FROM users ORDER BY high_score DESC LIMIT 10'
        )
        users = [dict(row) for row in cursor.fetchall()]
        
        return jsonify(users), 200

    except Exception as e:
        print(f"Error fetching leaderboard: {e}")
        return jsonify({'error': 'Failed to fetch leaderboard'}), 500


# --- Frontend Route ---

@app.route('/')
def home():
    """Serve the main HTML page from the templates folder."""
    # This will look for 'index.html' in a folder named 'templates'
    return render_template('index.html')

# --- Run the App ---
if __name__ == '__main__':
    init_db() # Create/update the database file and tables on first run
    app.run(host='0.0.0.0', port=8080, debug=True)

