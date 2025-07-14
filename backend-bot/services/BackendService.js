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
      return null;
    }
  }

  // Get user profile from backend server
  async getUserProfile(whatsappNumber) {
    try {
      const profileResponse = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/profile`);
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
      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/balance`);
      return response.data;
    } catch (error) {
      console.error('Error getting user balance:', error.response?.data || error.message);
      return null;
    }
  }

  // Send payment through backend server
  async sendPayment(whatsappNumber, amount, recipient) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/wallet/pay`, {
        amount: amount,
        recipient: recipient
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

  // Get user balance
  async getBalance(whatsappNumber) {
    const balanceData = await this.getUserBalance(whatsappNumber);
    return balanceData ? balanceData.balance : 0;
  }

  // Get user details
  async getUser(whatsappNumber) {
    return await this.getUserProfile(whatsappNumber);
  }

  // Add funds to user account (buy, deposit, etc.)
  async addFunds(whatsappNumber, amount, type = 'deposit', metadata = {}) {
    try {

      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transactions/add`, {
        amount: amount,
        type: type,
        metadata: metadata
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

      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transactions/remove`, {
        amount: amount,
        type: type,
        metadata: metadata
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
      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/transactions/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting transaction history:', error.response?.data || error.message);
      return null;
    }
  }

  // Buy tokens (onramp)
  async buyTokens(whatsappNumber, amount, paymentMethod) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/tokens/buy`, {
        amount: amount,
        payment_method: paymentMethod
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
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/tokens/sell`, {
        amount: amount,
        withdrawal_method: withdrawalMethod
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
      const response = await axios.put(`${this.BACKEND_SERVER_URL}/api/users/profile`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error.response?.data || error.message);
      return null;
    }
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
}

module.exports = BackendService; 