const axios = require('axios');

class BlockchainService {
  constructor() {
    this.BLOCKCHAIN_SERVER_URL = process.env.BLOCKCHAIN_SERVER_URL || 'http://localhost:3002';
  }

  // Register a new user with the blockchain server
  async registerUser(whatsappNumber, username = null) {
    try {
      const response = await axios.post(`${this.BLOCKCHAIN_SERVER_URL}/api/users/register`, {
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

  // Get user profile from blockchain server
  async getUserProfile(whatsappNumber) {
    try {
      // First login to get token
      const loginResponse = await axios.post(`${this.BLOCKCHAIN_SERVER_URL}/api/users/login`, {
        whatsapp_number: whatsappNumber,
        password: `temp_${Date.now()}` // This won't work, need proper auth
      });
      
      if (loginResponse.data.token) {
        const profileResponse = await axios.get(`${this.BLOCKCHAIN_SERVER_URL}/api/users/profile`, {
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

  // Get wallet balance from blockchain server
  async getWalletBalance(whatsappNumber) {
    try {
      // This would require proper authentication
      // For now, return null to use local wallet data
      return null;
    } catch (error) {
      console.error('Error getting wallet balance:', error.response?.data || error.message);
      return null;
    }
  }

  // Send payment through blockchain server
  async sendPayment(whatsappNumber, amount, recipient) {
    try {
      // This would require proper authentication
      // For now, return null to use local wallet simulation
      return null;
    } catch (error) {
      console.error('Error sending payment:', error.response?.data || error.message);
      return null;
    }
  }

  // Check blockchain server health
  async checkHealth() {
    try {
      const response = await axios.get(`${this.BLOCKCHAIN_SERVER_URL}/api/health`);
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

  // Get blockchain server URL
  getServerUrl() {
    return this.BLOCKCHAIN_SERVER_URL;
  }
}

module.exports = BlockchainService; 