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
      return { 
        exists: false, 
        requiresRegistration: true 
      };
    }
  }

  // Register a new user with the backend server
  async registerUser(whatsappNumber, username, pin=null) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/register`, {
        whatsapp_number: whatsappNumber,
        username: username,
        pin: pin
      });
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Get user profile from backend server
  async getUserData(whatsappNumber) {
    try {
      const userResponse = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/data/${whatsappNumber}`);
      return userResponse.data;
    } catch (error) {
      return { error : error.response?.data.message || error.message };
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
      return userResponse.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Check backend server health
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
      const response = await axios.get(`${this.BACKEND_SERVER_URL}/api/users/data/${whatsappNumber}`);
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Send payment through backend server
  async sendPayment(whatsappNumber, recipient, amount) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transfers/pay`, {
        whatsappNumber,
        recipient,
        amount
      });
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Deposit to vault through backend server
  async deposit(whatsappNumber, amount) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transfers/deposit`, {
        whatsappNumber,
        amount
      });
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Withdraw from vault through backend server
  async withdraw(whatsappNumber, amount) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/transfers/withdraw`, {
        whatsappNumber,
        amount
      });
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Add funds to user account (buy, deposit, etc.)
  async buyAssets(whatsappNumber, amount) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/ramps/onramp`, {
        whatsappNumber,
        amount
      });
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Sell tokens (offramp)
  async sellAssets(whatsappNumber, amount) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/ramps/offramp`, {
        whatsappNumber,
        amount,
      });
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // Update user activity in database
  async updateUserActivity(whatsappNumber) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/users/session/update`, {
        whatsapp_number: whatsappNumber
      });
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
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/contacts/setwallet`, {
        whatsappNumber,
        contactId,
        contactAddress
      });
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }

  // set contact information
  async setContact(whatsappNumber, contactName, contactNumber) {
    try {
      const response = await axios.post(`${this.BACKEND_SERVER_URL}/api/contacts/set`, {
        whatsappNumber, 
        contactName,
        contactNumber,
      });
      return response.data.message;
    } catch (error) {
      return error.response?.data.message || error.message;
    }
  }
}

module.exports = BackendService; 