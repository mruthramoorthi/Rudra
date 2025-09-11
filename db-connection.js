const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

let db = null;

function initializeDatabase() {
  if (!db) { // Prevent multiple pools from being created
    db = mysql.createPool({
      connectionLimit: 50, // Adjust for high traffic
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASS,
      database: process.env.DATABASE,
      waitForConnections: true,
      queueLimit: 0, // 0 means unlimited queue
      connectTimeout: 10000, // Set a 10s timeout for initial DB connection
    });

    console.log("MySQL Connection Pool Initialized");

    db.on('error', (err) => {
      console.error('Database error:', err);
      db = null; // Reset pool if there's an error
    });
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db; // Using promise-based queries
}

module.exports = { initializeDatabase, getDb };
