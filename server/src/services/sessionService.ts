import db from '../config/database';
import { encryptUserPin } from '../utils/crypto';
import { getCurrentUTCTimestamp, isSessionExpired } from '../utils/timestamp';

interface SessionStatus {
  exists: boolean;
  expired: boolean;
  lastActivity?: string;
  expirationTime?: string;
}

// Session management functions
const updateUserActivity = (whatsappNumber: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const utcTimestamp = getCurrentUTCTimestamp();
    db.run(
      'UPDATE users SET last_activity = ? WHERE whatsapp_number = ?',
      [utcTimestamp, whatsappNumber],
      (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

function getUserSessionStatus(whatsappNumber: string): Promise<SessionStatus> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT last_activity FROM users WHERE whatsapp_number = ?',
      [whatsappNumber],
      (err: any, user: any) => {
        if (err) {
          reject(err);
        } else if (!user) {
          resolve({ exists: false, expired: true });
        } else {
          const expired = isSessionExpired(user.last_activity);
          const lastActivityTime = new Date(user.last_activity);
          const expirationTime = new Date(lastActivityTime.getTime() + (5 * 60 * 1000)); // 5 minutes from last activity
          resolve({ 
            exists: true, 
            expired, 
            lastActivity: user.last_activity,
            expirationTime: expirationTime.toISOString()
          });
        }
      }
    );
  });
}

// Enhanced session management with PIN validation
function validateUserPin(whatsappNumber: string, pin: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT encrypted_pin FROM users WHERE whatsapp_number = ?',
      [whatsappNumber],
      (err: any, user: any) => {
        if (err) {
          reject(err);
        } else if (!user) {
          reject(new Error('User not found'));
        } else {
          try {
            const encryptedPin = encryptUserPin(pin, process.env.JWT_SECRET);
            const isValid = user.encrypted_pin === encryptedPin;
            resolve(isValid);
          } catch (error) {
            reject(error);
          }
        }
      }
    );
  });
}


function registerUser(whatsappNumber: string, username: string, pin: number): Promise<boolean> {
  const encryptedPin = encryptUserPin(pin, process.env.JWT_SECRET);
  const utcTimestamp = new Date().toISOString();
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (whatsapp_number, username, encrypted_pin,  created_at, last_activity) VALUES (?, ?, ?, ?, ?)',
      [whatsappNumber, username, encryptedPin, utcTimestamp, utcTimestamp], 
      (err: Error | null) => {
        if (err) {
          return reject(new Error('Failed to create user in database'));
        }
        resolve(true);
    });
  });
}

export {
  updateUserActivity,
  getUserSessionStatus,
  validateUserPin,
  registerUser,
  type SessionStatus
}; 