import sqlite3 from 'sqlite3';

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
function initializeDatabase(): void {
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

export default db; 