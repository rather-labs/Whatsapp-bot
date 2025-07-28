const axios = require('axios');
const jwt = require('jsonwebtoken');

class BackendService {
  constructor() {
    this.BACKEND_SERVER_URL = process.env.BACKEND_SERVER_URL;
    this.token = null;
    this.tokenExpiry = null;
    
    // Initialize JWT token
    this.initializeAuth();
  }

  // Initialize authentication with JWT token
  async initializeAuth() {
    try {
      await this.getAuthToken();
      // Only log successful authentication in development
      console.log('✅ Backend-bot authenticated with server');
    } catch (error) {
      console.error('❌ Failed to authenticate with server:', error.message);
    }
  }

  // Get JWT token from server
  async getAuthToken() {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/auth/token/backend-bot`, {
        secret: process.env.BACKEND_BOT_SECRET || 'default-backend-bot-secret'
      });
      
      this.token = response.data.token;
      
      // Decode token to get expiry
      const decoded = jwt.decode(this.token);
      this.tokenExpiry = decoded.exp * 1000; // Convert to milliseconds
      
      return this.token;
    } catch (error) {
      console.error('Failed to get auth token:', error.response?.data || error.message);
      throw error;
    }
  }

  // Check if token is expired and refresh if needed
  async ensureValidToken() {
    if (!this.token || (this.tokenExpiry && Date.now() >= this.tokenExpiry - 60000)) { // Refresh 1 minute before expiry
      await this.getAuthToken();
    }
  }

  // Create axios config with auth headers
  async createAuthConfig(config = {}) {
    await this.ensureValidToken();
    return {
      ...config,
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${this.token}`,
        'User-Agent': 'backend-bot/1.0.0'
      }
    };
  }

  // session validation 
  async validateSession(whatsappNumber, pin) {
    try {
      const config = await this.createAuthConfig();
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/session/validate`, {
        whatsapp_number: whatsappNumber,
        pin: pin
      }, config);
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
      const config = await this.createAuthConfig();
      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/session/status/${whatsappNumber}`, config);
      return response.data.sessionStatus;
    } catch (error) {
      return { 
        exists: false, 
        requiresRegistration: true 
      };
    }
  }

  // Register a new user with the backend server
  async registerUser(whatsappNumber, username, pin=null) {
    try {
      const config = await this.createAuthConfig();
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/register`, {
        whatsapp_number: whatsappNumber,
        username: username,
        pin: pin
      }, config);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Get user profile from backend server
  async getUserData(whatsappNumber) {
    try {
      const config = await this.createAuthConfig();
      const userResponse = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/data/${whatsappNumber}`, config);
      return userResponse.data;
    } catch (error) {
      return { error : error.response?.data.message || error.message };
    }
  }

  // Get/Set user risk profile from backend server
  async riskProfile(whatsappNumber, profile) {
    try {
      const config = await this.createAuthConfig();
      const userResponse = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/riskprofile`, {
        whatsappNumber,
        profile
      }, config);
      return userResponse.data.message;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data || error.message,
      };
    }
  }

  // Get/Set user authentication profile from backend server
  async authProfile(whatsappNumber, profile) {
    try {
      const config = await this.createAuthConfig();
      const userResponse = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/authprofile`, {
        whatsappNumber,
        profile
      }, config);
      return userResponse.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  async authThreshold(whatsappNumber, threshold) {
    try {
      const config = await this.createAuthConfig();
      const userResponse = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/auththreshold`, {
        whatsappNumber,
        threshold
      }, config);
      return userResponse.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Check backend server health (no auth required)
  async checkHealth() {
    try {
      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/health`);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Get user details
  async getUser(whatsappNumber) {
    try {
      const config = await this.createAuthConfig();
      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/data/${whatsappNumber}`, config);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Send payment through backend server
  async sendPayment(whatsappNumber, recipient, amount) {
    try {
      const config = await this.createAuthConfig();
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transfers/pay`, {
        whatsappNumber,
        recipient,
        amount
      }, config);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Deposit to vault through backend server
  async deposit(whatsappNumber, amount) {
    try {
      const config = await this.createAuthConfig();
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transfers/deposit`, {
        whatsappNumber,
        amount
      }, config);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Withdraw from vault through backend server
  async withdraw(whatsappNumber, amount) {
    try {
      const config = await this.createAuthConfig();
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transfers/withdraw`, {
        whatsappNumber,
        amount
      }, config);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Add funds to user account (buy, deposit, etc.)
  async buyAssets(whatsappNumber, amount) {
    try {
      const config = await this.createAuthConfig();
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/ramps/onramp`, {
        whatsappNumber,
        amount
      }, config);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Sell tokens (offramp)
  async sellAssets(whatsappNumber, amount) {
    try {
      const config = await this.createAuthConfig();
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/ramps/offramp`, {
        whatsappNumber,
        amount,
      }, config);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Update user activity in database
  async updateUserActivity(whatsappNumber) {
    try {
      const config = await this.createAuthConfig();
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/session/update`, {
        whatsapp_number: whatsappNumber
      }, config);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Get backend server URL
  getServerUrl() {
    return this.BACKEND_SERVER_URL;
  }

  // set wallet address for a contact
  async setWallet(whatsappNumber, contactId, contactAddress) {
    try {
      const config = await this.createAuthConfig();
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/contacts/setwallet`, {
        whatsappNumber,
        contactId,
        contactAddress
      }, config);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // set contact information
  async setContact(whatsappNumber, contactName, contactNumber) {
    try {
      const config = await this.createAuthConfig();
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/contacts/set`, {
        whatsappNumber, 
        contactName,
        contactNumber,
      }, config);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }
}

module.exports = BackendService; 