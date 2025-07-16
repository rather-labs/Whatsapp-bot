const axios = require('axios');

class BackendService {
  constructor() {
    this.BACKEND_SERVER_URL = process.env.BACKEND_SERVER_URL || 'http://localhost:3002';
  }

  // session validation 
  async validateSession(whatsappNumber, pin) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/session/validate`, {
        whatsapp_number: whatsappNumber,
        pin: pin
      });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data || error.message,
      };
    }
  }

  // Get session status from server
  async getSessionStatus(whatsappNumber) {
    try {
      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/session/status/${whatsappNumber}`);
      return response.data.sessionStatus;
    } catch (error) {
      if (error.response?.status === 404) {
        return { 
          exists: false, 
          requiresRegistration: true 
        };
      }
      console.error('Error getting session status:', error.response?.data || error.message);
      return null;
    }
  }

  // Register a new user with the backend server
  async registerUser(whatsappNumber, username, pin) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/register`, {
        whatsapp_number: whatsappNumber,
        username: username,
        pin: pin
      });
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data || error.message,
      };
    }
  }

  // Get user profile from backend server
  async getUserData(whatsappNumber) {
    try {
      const userResponse = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/data/${whatsappNumber}`);
      return userResponse.data;
    } catch (error) {
      console.error('Error getting user profile:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data || error.message,
      };
    }
  }

  // Get/Set user risk profile from backend server
  async riskProfile(whatsappNumber, profile) {
    try {
      const userResponse = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/riskprofile`, {
        whatsappNumber,
        profile
      });
      return userResponse.data;
    } catch (error) {
      console.error('Error getting user profile:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data || error.message,
      };
    }
  }

  // Get/Set user authentication profile from backend server
  async authProfile(whatsappNumber, profile) {
    try {
      const userResponse = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/authprofile`, {
        whatsappNumber,
        profile
      });
      return userResponse.data;
    } catch (error) {
      console.error('Error getting user profile:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data || error.message,
      };
    }
  }

  // Check backend server health
  async checkHealth() {
    try {
      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/health`);
      return {
        status: 'connected',
        data: response.data
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message
      };
    }
  }

  // Get user details
  async getUser(whatsappNumber) {
    return await this.getUserProfile(whatsappNumber);
  }

  // Send payment through backend server
  async sendPayment(whatsappNumber, recipient, amount) {
      return await axios.post(`${this.BACKEND_SERVER_URL}/api/transfers/pay`, {
        whatsappNumber,
        recipient,
        amount
      });
  }

  // Deposit to vault through backend server
  async deposit(whatsappNumber, amount) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transfers/deposit`, {
        whatsappNumber,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error depositing to vault:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data || error.message,
      };
    }
  }

  // Add funds to user account (buy, deposit, etc.)
  async buyAssets(whatsappNumber, amount) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/ramps/onramp`, {
        whatsappNumber: whatsappNumber,
        amount: amount
      });
      return response.data;
    } catch (error) {
      console.error('Error adding funds:', error.response?.data || error.message);
      return response;
    }
  }

  // Sell tokens (offramp)
  async sellAssets(whatsappNumber, amount) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/ramps/offramp`, {
        whatsappNumber: whatsappNumber,
        amount: amount,
      });
      return response.data;
    } catch (error) {
      console.error('Error selling tokens:', error.response?.data || error.message);
      return null;
    }
  }

  // Update user activity in database
  async updateUserActivity(whatsappNumber) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/session/update`, {
        whatsapp_number: whatsappNumber
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user activity:', error.response?.data || error.message);
      return null;
    }
  }

  // Get backend server URL
  getServerUrl() {
    return this.BACKEND_SERVER_URL;
  }
}

module.exports = BackendService; 