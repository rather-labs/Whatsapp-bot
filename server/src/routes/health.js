const express = require('express');
const { networkConfig, provider } = require('../config/blockchain');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: networkConfig.name,
    database: 'connected',
    blockchain: provider ? 'connected' : 'disconnected'
  });
});

module.exports = router; 