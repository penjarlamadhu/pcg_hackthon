const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Database file path
const DB_PATH = path.join(__dirname, 'real_estate.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database tables
const initDatabase = () => {
  // Create users table
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
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table created or already exists');
    }
  });
  // Create buyers table
  db.run(`CREATE TABLE IF NOT EXISTS buyers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    budget TEXT NOT NULL,
    location TEXT,
    property_type TEXT,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating buyers table:', err.message);
    } else {
      console.log('Buyers table created or already exists');
    }
  });

  // Create sellers table
  db.run(`CREATE TABLE IF NOT EXISTS sellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    property_type TEXT NOT NULL,
    location TEXT,
    price TEXT,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating sellers table:', err.message);
    } else {
      console.log('Sellers table created or already exists');
    }
  });

  // Create chat_history table
  db.run(`CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    intent TEXT,
    automation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating chat_history table:', err.message);
    } else {
      console.log('Chat history table created or already exists');
    }
  });

  // Create properties table
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers (id)
  )`, (err) => {
    if (err) {
      console.error('Error creating properties table:', err.message);
    } else {
      console.log('Properties table created or already exists');
    }
  });

  // Insert sample data if tables are empty
  setTimeout(insertSampleData, 1000);
};

// Authentication functions
const createUser = async (username, email, password, role = 'user') => {
  return new Promise((resolve, reject) => {
    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        reject(err);
        return;
      }
      
      const stmt = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)');
      stmt.run([username, email, hashedPassword, role], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username, email, role });
        }
      });
      stmt.finalize();
    });
  });
};

const findUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const verifyPassword = (plainPassword, hashedPassword) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Insert sample data
const insertSampleData = () => {
  // Check if users table has data
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (!err && row.count === 0) {
      // Insert sample users with hashed passwords
      const sampleUsers = [
        ['admin', 'admin@realestate.com', 'admin123', 'admin'],
        ['agent1', 'agent1@realestate.com', 'agent123', 'agent'],
        ['user1', 'user1@realestate.com', 'user123', 'user']
      ];

      // Hash passwords and insert users
      Promise.all(sampleUsers.map(async ([username, email, password, role]) => {
        try {
          const hashedPassword = await bcrypt.hash(password, 10);
          return new Promise((resolve, reject) => {
            const stmt = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)');
            stmt.run([username, email, hashedPassword, role], (err) => {
              if (err) reject(err);
              else resolve();
            });
            stmt.finalize();
          });
        } catch (error) {
          console.error('Error hashing password for', username, error);
        }
      })).then(() => {
        console.log('Sample users inserted');
      }).catch(error => {
        console.error('Error inserting sample users:', error);
      });
    }
  });

  // Check if buyers table has data
  db.get('SELECT COUNT(*) as count FROM buyers', (err, row) => {
    if (!err && row.count === 0) {
      // Insert sample buyers
      const sampleBuyers = [
        ['Rahul Kumar', '50L', 'Whitefield', '2BHK', 'rahul@email.com', '9876543210'],
        ['Anita Sharma', '80L', 'Indiranagar', '3BHK', 'anita@email.com', '9876543211'],
        ['Vikram Reddy', '60L', 'Marathahalli', '2BHK', 'vikram@email.com', '9876543212'],
        ['Priya Patel', '45L', 'HSR Layout', '1BHK', 'priya@email.com', '9876543213']
      ];

      const buyerStmt = db.prepare('INSERT INTO buyers (name, budget, location, property_type, contact) VALUES (?, ?, ?, ?, ?)');
      sampleBuyers.forEach(buyer => {
        buyerStmt.run(buyer, (err) => {
          if (err) console.error('Error inserting buyer:', err);
        });
      });
      buyerStmt.finalize(() => {
        console.log('Sample buyers inserted');
      });
    }
  });

  // Check if sellers table has data
  db.get('SELECT COUNT(*) as count FROM sellers', (err, row) => {
    if (!err && row.count === 0) {
      // Insert sample sellers
      const sampleSellers = [
        ['Mr. Sharma', '2BHK', 'Whitefield', '45L', 'sharma@email.com', '9876543220'],
        ['Priya Nair', '3BHK', 'Indiranagar', '85L', 'priya@email.com', '9876543221'],
        ['Rajesh Kumar', '2BHK', 'Marathahalli', '55L', 'rajesh@email.com', '9876543222'],
        ['Sunita Reddy', '1BHK', 'HSR Layout', '35L', 'sunita@email.com', '9876543223']
      ];

      const sellerStmt = db.prepare('INSERT INTO sellers (name, property_type, location, price, contact) VALUES (?, ?, ?, ?, ?)');
      sampleSellers.forEach(seller => {
        sellerStmt.run(seller, (err) => {
          if (err) console.error('Error inserting seller:', err);
        });
      });
      sellerStmt.finalize(() => {
        console.log('Sample sellers inserted');
      });
    }
  });

  // Check if properties table has data
  db.get('SELECT COUNT(*) as count FROM properties', (err, row) => {
    if (!err && row.count === 0) {
      // Insert sample properties
      const sampleProperties = [
        [1, 'Modern 2BHK Apartment', 'Spacious 2BHK with modern amenities', '2BHK', 'Whitefield', '45L', 2, 2, 1200],
        [2, 'Luxury 3BHK Villa', 'Premium 3BHK villa with garden', '3BHK', 'Indiranagar', '85L', 3, 3, 1800],
        [3, 'Cozy 2BHK Flat', 'Well-maintained 2BHK in prime location', '2BHK', 'Marathahalli', '55L', 2, 2, 1100],
        [4, 'Compact 1BHK Studio', 'Perfect 1BHK for singles', '1BHK', 'HSR Layout', '35L', 1, 1, 650]
      ];

      const propertyStmt = db.prepare('INSERT INTO properties (seller_id, title, description, property_type, location, price, bedrooms, bathrooms, area_sqft) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      sampleProperties.forEach(property => {
        propertyStmt.run(property, (err) => {
          if (err) console.error('Error inserting property:', err);
        });
      });
      propertyStmt.finalize(() => {
        console.log('Sample properties inserted');
      });
    }
  });
};

// Database operations
const database = {
  // Get all buyers
  getBuyers: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM buyers ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get all sellers
  getSellers: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM sellers ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get all properties
  getProperties: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.*, s.name as seller_name, s.contact as seller_contact 
        FROM properties p 
        LEFT JOIN sellers s ON p.seller_id = s.id 
        ORDER BY p.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Add new buyer
  addBuyer: (buyer) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO buyers (name, budget, location, property_type, contact) VALUES (?, ?, ?, ?, ?)');
      stmt.run([buyer.name, buyer.budget, buyer.location, buyer.property_type, buyer.contact], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...buyer });
      });
      stmt.finalize();
    });
  },

  // Update buyer
  updateBuyer: (id, buyer) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE buyers 
        SET name = ?, budget = ?, location = ?, property_type = ?, contact = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      stmt.run([buyer.name, buyer.budget, buyer.location, buyer.property_type, buyer.contact, id], function(err) {
        if (err) reject(err);
        else resolve({ updated: this.changes, id, ...buyer });
      });
      stmt.finalize();
    });
  },

  // Add new seller
  addSeller: (seller) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO sellers (name, property_type, location, price, contact) VALUES (?, ?, ?, ?, ?)');
      stmt.run([seller.name, seller.property_type, seller.location, seller.price, seller.contact], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...seller });
      });
      stmt.finalize();
    });
  },

  // Update seller
  updateSeller: (id, seller) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE sellers 
        SET name = ?, property_type = ?, location = ?, price = ?, contact = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      stmt.run([seller.name, seller.property_type, seller.location, seller.price, seller.contact, id], function(err) {
        if (err) reject(err);
        else resolve({ updated: this.changes, id, ...seller });
      });
      stmt.finalize();
    });
  },

  // Add chat message
  addChatMessage: (sessionId, sender, message, intent, automation) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO chat_history (session_id, sender, message, intent, automation) VALUES (?, ?, ?, ?, ?)');
      stmt.run([sessionId, sender, message, intent, automation], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, sessionId, sender, message, intent, automation });
      });
      stmt.finalize();
    });
  },

  // Get chat history
  getChatHistory: (sessionId = null) => {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM chat_history';
      let params = [];
      
      if (sessionId) {
        query += ' WHERE session_id = ?';
        params.push(sessionId);
      }
      
      query += ' ORDER BY created_at ASC';
      
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get recent activity
  getRecentActivity: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 'buyer' as type, name, created_at FROM buyers 
        UNION ALL 
        SELECT 'seller' as type, name, created_at FROM sellers 
        UNION ALL 
        SELECT 'chat' as type, sender as name, created_at FROM chat_history 
        ORDER BY created_at DESC 
        LIMIT 10
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get user profile
  getUserProfile: (userId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, username, email, role, phone, bio, location, company, profile_picture FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Update user profile
  updateUserProfile: (userId, profileData) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE users 
        SET username = ?, email = ?, phone = ?, bio = ?, location = ?, company = ?, profile_picture = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      stmt.run([
        profileData.username, 
        profileData.email, 
        profileData.phone, 
        profileData.bio, 
        profileData.location, 
        profileData.company, 
        profileData.profile_picture, 
        userId
      ], function(err) {
        if (err) reject(err);
        else resolve({ updated: this.changes });
      });
      stmt.finalize();
    });
  },

  // Close database connection
  close: () => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
};

// Initialize database on module load
initDatabase();

// Add authentication methods to database object
  database.createUser = createUser;
  database.findUserByUsername = findUserByUsername;
  database.findUserByEmail = findUserByEmail;
  database.verifyPassword = verifyPassword;

  module.exports = database;
