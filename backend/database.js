const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'real_estate.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('Error opening database:', err.message);
  else console.log('Connected to SQLite database');
});

function initDatabase() {

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    phone TEXT,
    bio TEXT,
    location TEXT,
    company TEXT,
    profile_picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS buyers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    budget TEXT NOT NULL,
    location TEXT,
    property_type TEXT,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    property_type TEXT NOT NULL,
    location TEXT,
    price TEXT,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    intent TEXT,
    automation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT NOT NULL,
    location TEXT NOT NULL,
    price TEXT NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  setTimeout(insertSampleData, 500);
}

async function insertSampleData() {

  db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
    if (!err && row.count === 0) {
      const users = [
        ['admin', 'admin@realestate.com', 'admin123', 'admin'],
        ['agent1', 'agent1@realestate.com', 'agent123', 'agent'],
        ['user1', 'user1@realestate.com', 'user123', 'user']
      ];

      for (const [username, email, password, role] of users) {
        const hashed = await bcrypt.hash(password, 10);
        db.run(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [username, email, hashed, role]
        );
      }
      console.log('Sample users inserted');
    }
  });

  db.get('SELECT COUNT(*) as count FROM buyers', (err, row) => {
    if (!err && row.count === 0) {
      const buyers = [
        ['Rahul Kumar', '50L', 'Whitefield', '2BHK', '9876543210'],
        ['Anita Sharma', '80L', 'Indiranagar', '3BHK', '9876543211']
      ];

      const stmt = db.prepare(
        'INSERT INTO buyers (name, budget, location, property_type, contact) VALUES (?, ?, ?, ?, ?)'
      );
      buyers.forEach(b => stmt.run(b));
      stmt.finalize();
      console.log('Sample buyers inserted');
    }
  });

  db.get('SELECT COUNT(*) as count FROM sellers', (err, row) => {
    if (!err && row.count === 0) {
      const sellers = [
        ['Mr. Sharma', '2BHK', 'Whitefield', '45L', '9876543220'],
        ['Priya Nair', '3BHK', 'Indiranagar', '85L', '9876543221']
      ];

      const stmt = db.prepare(
        'INSERT INTO sellers (name, property_type, location, price, contact) VALUES (?, ?, ?, ?, ?)'
      );
      sellers.forEach(s => stmt.run(s));
      stmt.finalize();
      console.log('Sample sellers inserted');
    }
  });
}

/* ---------------- DATABASE METHODS ---------------- */

const database = {

  /* USERS */
  createUser: async (username, email, password, role) => {
    const hashed = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashed, role],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, username, email, role });
        }
      );
    });
  },

  findUserByUsername: (username) =>
    new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username],
        (err, row) => err ? reject(err) : resolve(row)
      );
    }),

  findUserByEmail: (email) =>
    new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email],
        (err, row) => err ? reject(err) : resolve(row)
      );
    }),

  verifyPassword: (plain, hashed) =>
    bcrypt.compare(plain, hashed),

  getUserProfile: (id) =>
    new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id],
        (err, row) => err ? reject(err) : resolve(row)
      );
    }),

  updateUserProfile: (id, data) =>
    new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET username=?, email=?, phone=?, bio=?, location=?, company=?, profile_picture=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [data.username, data.email, data.phone, data.bio, data.location, data.company, data.profile_picture, id],
        function (err) {
          if (err) reject(err);
          else resolve({ updated: this.changes });
        }
      );
    }),

  /* BUYERS */
  getBuyers: () =>
    new Promise((resolve, reject) => {
      db.all('SELECT * FROM buyers ORDER BY created_at DESC',
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    }),

  addBuyer: (buyer) =>
    new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO buyers (name, budget, location, property_type, contact) VALUES (?, ?, ?, ?, ?)',
        [buyer.name, buyer.budget, buyer.location, buyer.property_type, buyer.contact],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...buyer });
        }
      );
    }),

  /* SELLERS */
  getSellers: () =>
    new Promise((resolve, reject) => {
      db.all('SELECT * FROM sellers ORDER BY created_at DESC',
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    }),

  addSeller: (seller) =>
    new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO sellers (name, property_type, location, price, contact) VALUES (?, ?, ?, ?, ?)',
        [seller.name, seller.property_type, seller.location, seller.price, seller.contact],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...seller });
        }
      );
    }),

  /* PROPERTIES */
  getProperties: () =>
    new Promise((resolve, reject) => {
      db.all('SELECT * FROM properties',
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    }),

  /* CHAT */
  addChatMessage: (sessionId, sender, message, intent, automation) =>
    new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO chat_history (session_id, sender, message, intent, automation) VALUES (?, ?, ?, ?, ?)',
        [sessionId, sender, message, intent, automation],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    })
};

initDatabase();
module.exports = database;
