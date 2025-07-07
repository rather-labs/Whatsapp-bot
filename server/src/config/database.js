const sqlite3 = require('sqlite3').verbose();

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      whatsapp_number TEXT PRIMARY KEY,
      username TEXT,
      encrypted_pin TEXT NOT NULL,
      wallet_address TEXT,
      risk_profile INTEGER DEFAULT 1,
      auth_profile INTEGER DEFAULT 1,
      wallet_balance REAL DEFAULT 0,
      vault_balance REAL DEFAULT 0,
      last_activity TEXT,
      created_at TEXT DEFAULT (datetime('now', 'utc')),
      updated_at TEXT DEFAULT (datetime('now', 'utc'))
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      user_whatsapp_number TEXT NOT NULL,
      name TEXT NOT NULL,
      contact_userid TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'utc')),
      FOREIGN KEY (user_whatsapp_number) REFERENCES users (whatsapp_number),
      UNIQUE(user_whatsapp_number, contact_userid)
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_whatsapp_number TEXT NOT NULL,
      tx_hash TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      recipient TEXT,
      status TEXT DEFAULT 'pending',
      gas_used INTEGER,
      gas_price TEXT,
      block_number INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'utc')),
      FOREIGN KEY (user_whatsapp_number) REFERENCES users (whatsapp_number)
    )`,
    `CREATE TABLE IF NOT EXISTS vault_deposits (
      id TEXT PRIMARY KEY,
      user_whatsapp_number TEXT NOT NULL,
      amount REAL NOT NULL,
      apy REAL DEFAULT 0.05,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'utc')),
      FOREIGN KEY (user_whatsapp_number) REFERENCES users (whatsapp_number)
    )`
  ];

  for (const table of tables) {
    db.run(table, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      }
    });
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});

module.exports = db; 