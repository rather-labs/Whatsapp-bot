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
      contact_whatsapp_number TEXT NOT NULL,
      contact_wallet_address TEXT,
      FOREIGN KEY (user_whatsapp_number) REFERENCES users (whatsapp_number),
      UNIQUE(user_whatsapp_number, contact_whatsapp_number),
      UNIQUE(user_whatsapp_number, name)
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

/**
 * Get recipient number from contacts table
 * @param userNumber - The user's WhatsApp number
 * @param contactName - The contact name
 * @returns contact whatsapp number
 */
export async function getContactWhatsappNumber(userNumber: string, contactName: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT contact_whatsapp_number FROM contacts WHERE user_whatsapp_number = ? AND name = ?',
      [userNumber, contactName],
      (err: any, row: any) => {
        if (err) {
          reject(err);
        } else if (row?.contact_whatsapp_number) {
          resolve(row.contact_whatsapp_number);
        } else {
          resolve(null);
        }
      }
    );
  });
};

/**
 * Get recipient number from contacts table
 * @param userNumber - The user's WhatsApp number
 * @param contactNumber - The contact number
 * @returns contact wallet address
 */
export async function getContactWalletAddress(userNumber: string, contactNumber: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT contact_wallet_address FROM contacts WHERE user_whatsapp_number = ? AND contact_whatsapp_number = ?',
      [userNumber, contactNumber],
      (err: any, row: any) => {
        if (err) {
          reject(err);
        } else if (row?.contact_wallet_address) {
          resolve(row.contact_wallet_address);
        } else {
          resolve(null);
        }
      }
    );
  });
};

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