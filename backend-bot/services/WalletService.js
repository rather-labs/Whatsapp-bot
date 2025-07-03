class WalletService {
  constructor() {
    this.walletStore = new Map();
  }

  // Initialize wallet for a user
  initializeWallet(userId) {
    if (!this.walletStore.has(userId)) {
      this.walletStore.set(userId, {
        balance: 1000, // Starting balance
        transactions: [],
        createdAt: new Date().toISOString()
      });
    }
    return this.walletStore.get(userId);
  }

  // Get wallet balance
  getBalance(userId) {
    const wallet = this.initializeWallet(userId);
    return wallet.balance;
  }

  // Get wallet details
  getWallet(userId) {
    return this.initializeWallet(userId);
  }

  // Add funds to wallet (buy, deposit, etc.)
  addFunds(userId, amount, type = 'deposit', metadata = {}) {
    const wallet = this.initializeWallet(userId);
    wallet.balance += amount;
    wallet.transactions.push({
      type: type,
      amount: amount,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    return wallet;
  }

  // Remove funds from wallet (sell, withdraw, payment, etc.)
  removeFunds(userId, amount, type = 'withdrawal', metadata = {}) {
    const wallet = this.initializeWallet(userId);
    
    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }
    
    wallet.balance -= amount;
    wallet.transactions.push({
      type: type,
      amount: -amount,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    return wallet;
  }

  // Transfer funds between wallets
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
      fromWallet: this.getWallet(fromUserId),
      toWallet: this.getWallet(toUserId)
    };
  }

  // Get all wallets summary
  getAllWallets() {
    const wallets = {};
    this.walletStore.forEach((wallet, userId) => {
      wallets[userId] = {
        balance: wallet.balance,
        transactionCount: wallet.transactions.length,
        createdAt: wallet.createdAt
      };
    });
    return wallets;
  }

  // Get wallet count
  getWalletCount() {
    return this.walletStore.size;
  }

  // Check if user has sufficient balance
  hasSufficientBalance(userId, amount) {
    const wallet = this.initializeWallet(userId);
    return wallet.balance >= amount;
  }

  // Get transaction history
  getTransactionHistory(userId, limit = 10) {
    const wallet = this.initializeWallet(userId);
    return wallet.transactions.slice(-limit);
  }
}

module.exports = WalletService; 