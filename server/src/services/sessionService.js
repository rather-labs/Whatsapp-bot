const db = require('../config/database');
const { encryptUserPin } = require('../utils/crypto');
const { getCurrentUTCTimestamp, isSessionExpired } = require('../utils/timestamp');

// Session management functions
const updateUserActivity = (whatsappNumber) => {
  return new Promise((resolve, reject) => {
    const utcTimestamp = getCurrentUTCTimestamp();
    db.run(
      'UPDATE users SET last_activity = ? WHERE whatsapp_number = ?',
      [utcTimestamp, whatsappNumber],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

function getUserSessionStatus(whatsappNumber) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT last_activity FROM users WHERE whatsapp_number = ?',
      [whatsappNumber],
      (err, user) => {
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
function validateUserPin(whatsappNumber, pin) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT encrypted_pin FROM users WHERE whatsapp_number = ?',
      [whatsappNumber],
      (err, user) => {
        if (err) {
          reject(err);
        } else if (!user) {
          resolve({ valid: false, message: 'User not found' });
        } else {
          try {
            const encryptedPin = encryptUserPin(pin, process.env.JWT_SECRET);
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

module.exports = {
  updateUserActivity,
  getUserSessionStatus,
  validateUserPin
}; 