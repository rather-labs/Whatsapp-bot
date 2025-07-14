# Blockchain Integration Setup

This guide explains how to set up the blockchain integration for the WhatsApp bot server.

## Environment Variables Required

Create a `.env` file in the server directory with the following variables:

```bash
# Server Configuration
BACKEND_PORT=3002
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Network Configuration (default: baseSepolia)
NETWORK=baseSepolia

# RPC URLs
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
HARDHAT_RPC=http://127.0.0.1:8545

# Contract Addresses
USDC_CONTRACT_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7c
VAULT_CONTRACT_ADDRESS=0x... # Deploy your vault contract and add the address here

# Relayer Configuration (Required for on-chain registration)
PRIVATE_KEY=0x... # Private key of the relayer wallet that has RELAYER_ROLE on the vault contract

# Optional: Custom USDC addresses for different networks
BASE_SEPOLIA_TOKEN_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7c
BASE_MAINNET_TOKEN_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

## Setup Steps

### 1. Deploy the Vault Contract

First, deploy the TokenVaultWithRelayer contract to your chosen network:

```bash
# For Base Sepolia (recommended for testing)
npx hardhat run scripts/deploy.js --network baseSepolia

# For Base Mainnet (production)
npx hardhat run scripts/deploy.js --network base
```

### 2. Configure the Relayer

After deploying the vault contract:

1. Get the deployed contract address
2. Add the `RELAYER_ROLE` to your relayer wallet:
   ```solidity
   vaultContract.grantRole(RELAYER_ROLE, relayerWalletAddress);
   ```
3. Add the relayer's private key to your `.env` file

### 3. Update Environment Variables

1. Set `VAULT_CONTRACT_ADDRESS` to your deployed contract address
2. Set `PRIVATE_KEY` to your relayer wallet's private key
3. Choose your network with the `NETWORK` variable

## API Changes

The registration and check endpoints now include blockchain data:

### Registration Response
```json
{
  "message": "User registered successfully",
  "whatsappNumber": "1234567890",
  "walletAddress": "0x...",
  "walletBalance": 0,
  "vaultBalance": 0,
  "blockchainData": {
    "userId": "1234567890",
    "transactionHash": "0x...",
    "blockNumber": "12345",
    "network": {
      "network": "baseSepolia",
      "chainId": 84532,
      "name": "Base Sepolia Testnet",
      "rpc": "https://sepolia.base.org"
    }
  }
}
```

### Check Response
```json
{
  "registered": true,
  "user": {
    "whatsapp_number": "1234567890",
    "username": "john_doe",
    "wallet_address": "0x..."
  },
  "blockchainData": {
    "userId": "1234567890",
    "walletAddress": "0x...",
    "riskProfile": "1",
    "authProfile": "1",
    "assets": "0",
    "isRegistered": true,
    "network": {
      "network": "baseSepolia",
      "chainId": 84532,
      "name": "Base Sepolia Testnet",
      "rpc": "https://sepolia.base.org"
    }
  }
}
```

## Testing

1. Start the server: `npm run dev`
2. Test registration: `POST /api/users/register`
3. Test check: `GET /api/users/check/:whatsapp_number`
4. Test login: `POST /api/users/login`

## Troubleshooting

### Common Issues

1. **"Relayer wallet not configured"**
   - Make sure `PRIVATE_KEY` is set in your `.env` file
   - Ensure the wallet has `RELAYER_ROLE` on the vault contract

2. **"User already registered on-chain"**
   - The user is already registered in the smart contract
   - Check the blockchain data in the response

3. **"Failed to fetch blockchain data"**
   - Check your RPC URL is correct
   - Verify the vault contract address is correct
   - Ensure the network is accessible

4. **"Invalid wallet address"**
   - Make sure the wallet address is a valid Ethereum address
   - Check the address format (should start with 0x)

### Network-Specific Notes

- **Base Sepolia**: Use for testing, has testnet USDC
- **Base Mainnet**: Use for production, requires real USDC
- **Hardhat**: Use for local development, deploy your own USDC 