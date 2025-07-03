const axios = require('axios');

class BackendService {
  constructor() {
    this.BACKEND_SERVER_URL = process.env.BACKEND_SERVER_URL || 'http://localhost:3002';
    this.userStore = new Map();
  }

  // Register a new user with the backend server
  async registerUser(whatsappNumber, username = null) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/register`, {
        whatsapp_number: whatsappNumber,
        username: username,
        password: `temp_${Date.now()}` // Temporary password
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
      // First login to get token
      const loginResponse = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/login`, {
        whatsapp_number: whatsappNumber,
        password: `temp_${Date.now()}` // This won't work, need proper auth
      });
      
      if (loginResponse.data.token) {
        const profileResponse = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${loginResponse.data.token}` }
        });
        return profileResponse.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error.response?.data || error.message);
      return null;
    }
  }

  // Get user balance from backend server
  async getUserBalance(whatsappNumber) {
    try {
      // This would require proper authentication
      // For now, return null to use local user data
      return null;
    } catch (error) {
      console.error('Error getting user balance:', error.response?.data || error.message);
      return null;
    }
  }

  // Send payment through backend server
  async sendPayment(whatsappNumber, amount, recipient) {
    try {
      // This would require proper authentication
      // For now, return null to use local user simulation
      return null;
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

  // Initialize user account
  initializeUser(userId) {
    if (!this.userStore.has(userId)) {
      this.userStore.set(userId, {
        balance: 1000, // Starting balance
        transactions: [],
        createdAt: new Date().toISOString()
      });
    }
    return this.userStore.get(userId);
  }

  // Get user balance
  getBalance(userId) {
    const user = this.initializeUser(userId);
    return user.balance;
  }

  // Get user details
  getUser(userId) {
    return this.initializeUser(userId);
  }

  // Add funds to user account (buy, deposit, etc.)
  addFunds(userId, amount, type = 'deposit', metadata = {}) {
    const user = this.initializeUser(userId);
    user.balance += amount;
    user.transactions.push({
      type: type,
      amount: amount,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    return user;
  }

  // Remove funds from user account (sell, withdraw, payment, etc.)
  removeFunds(userId, amount, type = 'withdrawal', metadata = {}) {
    const user = this.initializeUser(userId);
    
    if (user.balance < amount) {
      throw new Error('Insufficient balance');
    }
    
    user.balance -= amount;
    user.transactions.push({
      type: type,
      amount: -amount,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    return user;
  }

  // Transfer funds between users
  transferFunds(fromUserId, toUserId, amount, metadata = {}) {
    // Remove from sender
    this.removeFunds(fromUserId, amount, 'payment', {
      recipient: toUserId,
      ...metadata
    });
    
    // Add to recipient
    this.addFunds(toUserId, amount, 'received', {
      sender: fromUserId,
      ...metadata
    });
    
    return {
      fromUser: this.getUser(fromUserId),
      toUser: this.getUser(toUserId)
    };
  }

  // Get all users summary
  getAllUsers() {
    const users = {};
    this.userStore.forEach((user, userId) => {
      users[userId] = {
        balance: user.balance,
        transactionCount: user.transactions.length,
        createdAt: user.createdAt
      };
    });
    return users;
  }

  // Get user count
  getUserCount() {
    return this.userStore.size;
  }

  // Check if user has sufficient balance
  hasSufficientBalance(userId, amount) {
    const user = this.initializeUser(userId);
    return user.balance >= amount;
  }

  // Get transaction history
  getTransactionHistory(userId, limit = 10) {
    const user = this.initializeUser(userId);
    return user.transactions.slice(-limit);
  }

  // Get backend server URL
  getServerUrl() {
    return this.BACKEND_SERVER_URL;
  }
}

module.exports = BackendService; 