import supabase from '../config/database';
import { encryptUserPin } from '../utils/crypto';
import { getCurrentUTCTimestamp, isSessionExpired } from '../utils/timestamp';

interface SessionStatus {
  exists: boolean;
  expired: boolean;
  lastActivity?: string;
  expirationTime?: string;
}

// Session management functions
const updateUserActivity = async (whatsappNumber: string): Promise<void> => {
  try {
    const utcTimestamp = getCurrentUTCTimestamp();
    const { error } = await supabase
      .from('users')
      .update({ last_activity: utcTimestamp })
      .eq('whatsapp_number', whatsappNumber);

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error('Error updating user activity:', err);
    throw err;
  }
};

async function getUserSessionStatus(whatsappNumber: string): Promise<SessionStatus> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('last_activity')
      .eq('whatsapp_number', whatsappNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { exists: false, expired: true };
      }
      throw error;
    }

    if (!data) {
      return { exists: false, expired: true };
    }

    const expired = isSessionExpired(data.last_activity);
    const lastActivityTime = new Date(data.last_activity);
    const expirationTime = new Date(lastActivityTime.getTime() + (5 * 60 * 1000)); // 5 minutes from last activity
    
    return { 
      exists: true, 
      expired, 
      lastActivity: data.last_activity,
      expirationTime: expirationTime.toISOString()
    };
  } catch (err) {
    console.error('Error getting user session status:', err);
    throw err;
  }
}

// Enhanced session management with PIN validation
async function validateUserPin(whatsappNumber: string, pin: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('encrypted_pin')
      .eq('whatsapp_number', whatsappNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('User not found');
      }
      throw error;
    }

    if (!data) {
      throw new Error('User not found');
    }

    const encryptedPin = encryptUserPin(pin, process.env.JWT_SECRET);
    const isValid = data.encrypted_pin === encryptedPin;
    return isValid;
  } catch (err) {
    console.error('Error validating user PIN:', err);
    throw err;
  }
}

async function registerUser(whatsappNumber: string, username: string, pin: number): Promise<boolean> {
  try {
    const encryptedPin = encryptUserPin(pin, process.env.JWT_SECRET);
    const utcTimestamp = new Date().toISOString();
    
    const { error } = await supabase
      .from('users')
      .insert({
        whatsapp_number: whatsappNumber,
        username: username,
        encrypted_pin: encryptedPin,
        created_at: utcTimestamp,
        last_activity: utcTimestamp
      });

    if (error) {
      throw new Error(`Failed to create user in database: ${error.message}`);
    }

    return true;
  } catch (err) {
    console.error('Error registering user:', err);
    throw err;
  }
}

export {
  updateUserActivity,
  getUserSessionStatus,
  validateUserPin,
  registerUser,
  type SessionStatus
}; 