class SessionManager {
  constructor(backendService) {
    this.backendService = backendService;
    this.pendingPinResponses = new Map(); // Store pending PIN responses only
  }

  // Check if user session is expired and handle PIN prompting
  async checkAndHandleSession(whatsappNumber, contact) {
    try {

      const sessionResult = await this.getSessionInfo(whatsappNumber);
      
      if (!sessionResult) {
        return { registered: false, requiresPin: false, 
          message: "*User not registered*\n\nPlease register first with /register" 
        };
      }

      // User needs to register
      if (sessionResult.requiresRegistration) {
        return { registered: false, requiresPin: false, 
          message: "*User not registered*\n\nPlease register first with /register" 
        };
      }

      // Session is valid
      if (sessionResult.success && !sessionResult.requiresPin) {
        return { active: true, requiresPin: false, message: null };
      }

      // Session expired, prompt for PIN
      if (sessionResult.requiresPin) {
        const timestamp = new Date();
        this.pendingPinResponses.set(whatsappNumber, { 
          timestamp: timestamp 
        });
              
        const userName = contact.pushname || contact.number || whatsappNumber;
        return {
          requiresPin: true,
          message: `🔐 *Session Expired*\n\nHi ${userName}! Your session has expired due to inactivity.\n\nPlease enter your PIN to continue:\n\n*PIN:* (4-6 digits)\n\n⏰ *You have 7 seconds to enter your PIN*`
        };
      }
      
      return { registered: true, requiresPin: false, message: null };
    } catch (error) {
      console.error('Error checking session:', error);
      return { registered: false, requiresPin: false, message: null };
    }
  }

  // Handle PIN input from user
  async handlePinInput(whatsappNumber, pin) {
    try {
      const pendingResponse = this.pendingPinResponses.get(whatsappNumber);
      
      if (!pendingResponse) {
        return { success: false, message: 'No PIN request pending or PIN request has expired' };
      }

      // Check if PIN request has expired (7 seconds)
      const now = new Date();
      const timeDiff = now - pendingResponse.timestamp;
      if (timeDiff > 7000) {
        this.pendingPinResponses.delete(whatsappNumber);
        return { 
          success: false, 
          message: '❌ *PIN Request Expired*\n\nYour PIN request has expired. Please try again with /help or any command.' 
        };
      }

      // update timestamp
      pendingResponse.timestamp = new Date();
      this.pendingPinResponses.set(whatsappNumber, pendingResponse);

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
      
      if (sessionResult.success) {
        // PIN is correct, clear pending response
        this.pendingPinResponses.delete(whatsappNumber);
        
        return { 
          success: true, 
          message: `✅ *PIN Verified*\n\nSession restored! 
You can now continue using the bot.

*For security, erase the PIN message from your phone*

Type /help to see available commands.`
        };
      }
      
      // PIN is incorrect
      return { 
        success: false, 
        message: sessionResult.message.error?? '❌ *Incorrect PIN*\n\nPlease enter your correct PIN:\n\n*PIN:* (4-6 digits)' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: '❌ *Error*\n\nAn error occurred while verifying your PIN. Please try again:\n\n*PIN:* (4-6 digits)' 
      };
    }
  }

  // Check if user is awaiting PIN input
  isAwaitingPin(whatsappNumber) {
    const pendingResponse = this.pendingPinResponses.get(whatsappNumber);
    if (!pendingResponse) {
      return false;
    }
    
    // Check if PIN request has expired (7 seconds)
    const now = new Date();
    const timeDiff = now - pendingResponse.timestamp;
    if (timeDiff > 7000) {
      this.pendingPinResponses.delete(whatsappNumber);
      return false;
    }
    
    return true;
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
      await this.backendService.updateUserActivity(whatsappNumber);
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  // Clear user session
  clearSession(whatsappNumber) {
    this.pendingPinResponses.delete(whatsappNumber);
  }

  // Get session info for debugging
  async getSessionInfo(whatsappNumber) {
    try {
      const sessionStatus = await this.backendService.getSessionStatus(whatsappNumber);

      if (!sessionStatus) {
        return null;
      }

      const pendingPin = this.pendingPinResponses.has(whatsappNumber);
      
      sessionStatus.pendingPin = pendingPin;
      return sessionStatus;
    } catch (error) {
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