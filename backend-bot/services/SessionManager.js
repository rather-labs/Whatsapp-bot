class SessionManager {
  constructor(backendService) {
    this.backendService = backendService;
    this.pendingPinResponses = new Map(); // Store pending PIN responses only
  }

  // Check if user session is expired and handle PIN prompting
  async checkAndHandleSession(whatsappNumber, contact) {
    try {
      const sessionResult = await this.backendService.validateSession(whatsappNumber);
      
      if (!sessionResult) {
        return { requiresPin: false, message: null };
      }

      // User needs to register
      if (sessionResult.requiresRegistration) {
        return { requiresPin: false, message: null };
      }

      // Session is valid
      if (sessionResult.success && !sessionResult.requiresPin) {
        return { requiresPin: false, message: null };
      }

      // Session expired, prompt for PIN
      if (sessionResult.requiresPin) {
        this.pendingPinResponses.set(whatsappNumber, { 
          timestamp: new Date() 
        });
        
        const userName = contact.pushname || contact.number || whatsappNumber;
        return {
          requiresPin: true,
          message: `🔐 *Session Expired*\n\nHi ${userName}! Your session has expired due to inactivity.\n\nPlease enter your PIN to continue:\n\n*PIN:* (4-6 digits)`
        };
      }
      
      return { requiresPin: false, message: null };
    } catch (error) {
      console.error('Error checking session:', error);
      return { requiresPin: false, message: null };
    }
  }

  // Handle PIN input from user
  async handlePinInput(whatsappNumber, pin) {
    try {
      const pendingResponse = this.pendingPinResponses.get(whatsappNumber);
      
      if (!pendingResponse) {
        return { success: false, message: 'No PIN request pending' };
      }

      // Validate PIN format
      const pinNumber = Number.parseInt(pin, 10);
      if (Number.isNaN(pinNumber) || pinNumber < 1000 || pinNumber > 999999) {
        return { 
          success: false, 
          message: '❌ *Invalid PIN Format*\n\nPIN must be a 4-6 digit number.\n\nPlease try again:\n\n*PIN:* (4-6 digits)' 
        };
      }

      // Validate PIN with server
      const sessionResult = await this.backendService.validateSession(whatsappNumber, pinNumber);
      
      if (sessionResult.success && sessionResult.sessionRestored) {
        // PIN is correct, clear pending response
        this.pendingPinResponses.delete(whatsappNumber);
        
        return { 
          success: true, 
          message: '✅ *PIN Verified*\n\nSession restored! You can now continue using the bot.\n\nType /help to see available commands.' 
        };
      }
      
      // PIN is incorrect
      return { 
        success: false, 
        message: '❌ *Incorrect PIN*\n\nPlease enter your correct PIN:\n\n*PIN:* (4-6 digits)' 
      };
    } catch (error) {
      console.error('Error handling PIN input:', error);
      return { 
        success: false, 
        message: '❌ *Error*\n\nAn error occurred while verifying your PIN. Please try again:\n\n*PIN:* (4-6 digits)' 
      };
    }
  }

  // Check if user is awaiting PIN input
  isAwaitingPin(whatsappNumber) {
    return this.pendingPinResponses.has(whatsappNumber);
  }

  // Check if user has an active session (delegated to server)
  async hasActiveSession(whatsappNumber) {
    try {
      const sessionStatus = await this.backendService.getSessionStatus(whatsappNumber);
      return sessionStatus?.exists && !sessionStatus.requiresPin;
    } catch (error) {
      console.error('Error checking active session:', error);
      return false;
    }
  }

  // Update user activity (delegated to server)
  async updateActivity(whatsappNumber) {
    try {
      await this.backendService.validateSession(whatsappNumber);
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  // Clear user session
  clearSession(whatsappNumber) {
    this.pendingPinResponses.delete(whatsappNumber);
    this.backendService.clearUserSession(whatsappNumber);
  }

  // Get session info for debugging
  async getSessionInfo(whatsappNumber) {
    try {
      const sessionStatus = await this.backendService.getSessionStatus(whatsappNumber);
      const pendingPin = this.pendingPinResponses.has(whatsappNumber);
      
      return {
        exists: sessionStatus?.exists ?? false,
        expired: sessionStatus?.expired ?? true,
        requiresPin: sessionStatus?.requiresPin ?? false,
        pendingPin: pendingPin,
        lastActivity: sessionStatus?.lastActivity ?? null
      };
    } catch (error) {
      console.error('Error getting session info:', error);
      return null;
    }
  }

  // Get all pending PIN responses (for admin purposes)
  getAllPendingPins() {
    return Array.from(this.pendingPinResponses.entries()).map(([number, response]) => ({
      whatsappNumber: number,
      timestamp: response.timestamp
    }));
  }
}

module.exports = SessionManager; 