import db from '../config/database';
import { encryptUserPin } from '../utils/crypto';
import { getCurrentUTCTimestamp, isSessionExpired } from '../utils/timestamp';

interface SessionStatus {
  exists: boolean;
  expired: boolean;
  lastActivity?: string;
  expirationTime?: string;
}

interface PinValidationResult {
  valid: boolean;
  message: string;
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
function validateUserPin(whatsappNumber: string, pin: string): Promise<PinValidationResult> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT encrypted_pin FROM users WHERE whatsapp_number = ?',
      [whatsappNumber],
      (err: any, user: any) => {
        if (err) {
          reject(err);
        } else if (!user) {
          resolve({ valid: false, message: 'User not found' });
        } else {
          try {
            const encryptedPin = encryptUserPin(pin, process.env.JWT_SECRET || 'your-secret-key');
            const isValid = user.encrypted_pin === encryptedPin;
            resolve({ 
              valid: isValid, 
              message: isValid ? 'PIN validated successfully' : 'Invalid PIN' 
            });
          } catch (error) {
            reject(error);
          }
        }
      }
    );
  });
}

export {
  updateUserActivity,
  getUserSessionStatus,
  validateUserPin,
  type SessionStatus,
  type PinValidationResult
}; 