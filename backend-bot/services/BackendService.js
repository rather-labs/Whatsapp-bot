const axios = require('axios');

class BackendService {
  constructor() {
    this.BACKEND_SERVER_URL = process.env.BACKEND_SERVER_URL || 'http://localhost:3002';
    this.userTokens = new Map(); // Store user tokens for authenticated requests
  }

  // Helper method to get user token
  async getUserToken(whatsappNumber, pin = null) {
    if (this.userTokens.has(whatsappNumber)) {
      return this.userTokens.get(whatsappNumber);
    }

    // If no PIN provided and no stored token, return null
    if (!pin) {
      return null;
    }

    try {
      const loginResponse = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/login`, {
        whatsapp_number: whatsappNumber,
        pin: pin
      });
      
      if (loginResponse.data.token) {
        this.userTokens.set(whatsappNumber, loginResponse.data.token);
        return loginResponse.data.token;
      }
      return null;
    } catch (error) {
      console.error('Error getting user token:', error.response?.data || error.message);
      return null;
    }
  }

  // Enhanced session validation 
  async validateSession(whatsappNumber, pin) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/session/validate`, {
        whatsapp_number: whatsappNumber,
        pin: pin
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { 
          success: false, 
          requiresRegistration: true,
          message: 'User not found, registration required'
        };
      }
      if (error.response?.status === 401) {
        return error.response.data;
      }
      console.error('Error validating session:', error.response?.data || error.message);
      return { 
        success: false, 
        message: 'Session validation failed',
        requiresPin: false
      };
    }
  }

  // Get session status from server
  async getSessionStatus(whatsappNumber) {
    try {
      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/session/status/${whatsappNumber}`);
      return response.data;
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
      return null;
    }
  }

  // Get user profile from backend server
  async getUserProfile(whatsappNumber) {
    try {
      const token = await this.getUserToken(whatsappNumber);
      if (!token) return null;

      const profileResponse = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return profileResponse.data;
    } catch (error) {
      console.error('Error getting user profile:', error.response?.data || error.message);
      return null;
    }
  }

    // Get user profile from backend server
    async getUserData(whatsappNumber) {
      try {
        const userResponse = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/data/${whatsappNumber}`);
        return userResponse.data;
      } catch (error) {
        console.error('Error getting user profile:', error.response?.data || error.message);
        return null;
      }
    }

  // Get user balance from backend server
  async getUserBalance(whatsappNumber) {
    try {
      const token = await this.getUserToken(whatsappNumber);
      if (!token) return null;

      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user balance:', error.response?.data || error.message);
      return null;
    }
  }

  // Send payment through backend server
  async sendPayment(whatsappNumber, amount, recipient) {
    try {
      const token = await this.getUserToken(whatsappNumber);
      if (!token) return null;

      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/wallet/pay`, {
        amount: amount,
        recipient: recipient
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending payment:', error.response?.data || error.message);
      return null;
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

  // Get user balance (updated to use backend)
  async getBalance(whatsappNumber) {
    const balanceData = await this.getUserBalance(whatsappNumber);
    return balanceData ? balanceData.balance : 0;
  }

  // Get user details (updated to use backend)
  async getUser(whatsappNumber) {
    return await this.getUserProfile(whatsappNumber);
  }

  // Add funds to user account (buy, deposit, etc.)
  async addFunds(whatsappNumber, amount, type = 'deposit', metadata = {}) {
    try {
      const token = await this.getUserToken(whatsappNumber);
      if (!token) return null;

      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transactions/add`, {
        amount: amount,
        type: type,
        metadata: metadata
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding funds:', error.response?.data || error.message);
      return null;
    }
  }

  // Remove funds from user account (sell, withdraw, payment, etc.)
  async removeFunds(whatsappNumber, amount, type = 'withdrawal', metadata = {}) {
    try {
      const token = await this.getUserToken(whatsappNumber);
      if (!token) return null;

      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transactions/remove`, {
        amount: amount,
        type: type,
        metadata: metadata
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing funds:', error.response?.data || error.message);
      return null;
    }
  }

  // Transfer funds between users
  async transferFunds(fromWhatsappNumber, toWhatsappNumber, amount, metadata = {}) {
    try {
      const token = await this.getUserToken(fromWhatsappNumber);
      if (!token) return null;

      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transactions/transfer`, {
        to_whatsapp_number: toWhatsappNumber,
        amount: amount,
        metadata: metadata
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error transferring funds:', error.response?.data || error.message);
      return null;
    }
  }

  // Get all users summary (admin function)
  async getAllUsers(adminToken) {
    try {
      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting all users:', error.response?.data || error.message);
      return null;
    }
  }

  // Get user count (admin function)
  async getUserCount(adminToken) {
    try {
      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/admin/users/count`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      return response.data.count;
    } catch (error) {
      console.error('Error getting user count:', error.response?.data || error.message);
      return null;
    }
  }

  // Check if user has sufficient balance
  async hasSufficientBalance(whatsappNumber, amount) {
    const balanceData = await this.getUserBalance(whatsappNumber);
    return balanceData ? balanceData.balance >= amount : false;
  }

  // Get transaction history
  async getTransactionHistory(whatsappNumber, limit = 10) {
    try {
      const token = await this.getUserToken(whatsappNumber);
      if (!token) return null;

      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/transactions/history?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting transaction history:', error.response?.data || error.message);
      return null;
    }
  }

  // Buy tokens (onramp)
  async buyTokens(whatsappNumber, amount, paymentMethod) {
    try {
      const token = await this.getUserToken(whatsappNumber);
      if (!token) return null;

      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/tokens/buy`, {
        amount: amount,
        payment_method: paymentMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error buying tokens:', error.response?.data || error.message);
      return null;
    }
  }

  // Sell tokens (offramp)
  async sellTokens(whatsappNumber, amount, withdrawalMethod) {
    try {
      const token = await this.getUserToken(whatsappNumber);
      if (!token) return null;

      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/tokens/sell`, {
        amount: amount,
        withdrawal_method: withdrawalMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error selling tokens:', error.response?.data || error.message);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(whatsappNumber, updates) {
    try {
      const token = await this.getUserToken(whatsappNumber);
      if (!token) return null;

      const response = await axios.put(`${this.BACKEND_SERVER_URL}/api/users/profile`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error.response?.data || error.message);
      return null;
    }
  }

  // Change user PIN
  async changePin(whatsappNumber, oldPin, newPin) {
    try {
      const token = await this.getUserToken(whatsappNumber, oldPin);
      if (!token) return null;

      const response = await axios.put(`${this.BACKEND_SERVER_URL}/api/users/pin`, {
        old_pin: oldPin,
        new_pin: newPin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update stored token if successful
      if (response.data.success) {
        this.userTokens.delete(whatsappNumber);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error changing PIN:', error.response?.data || error.message);
      return null;
    }
  }

  // Logout user (clear stored token)
  logoutUser(whatsappNumber) {
    this.userTokens.delete(whatsappNumber);
    return { success: true };
  }

  // Get backend server URL
  getServerUrl() {
    return this.BACKEND_SERVER_URL;
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

  // Clear user token when session expires
  clearUserSession(whatsappNumber) {
    this.userTokens.delete(whatsappNumber);
  }
}

module.exports = BackendService; 