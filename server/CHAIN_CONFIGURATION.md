# Chain Configuration

This document explains the supported blockchain networks and their configuration for the WhatsApp bot server.

## Supported Networks

The server now supports the following blockchain networks:

### 1. Base Sepolia (Default)
- **Chain ID**: 84532
- **Network**: Testnet
- **RPC URL**: `https://sepolia.base.org`
- **USDC Address**: `0x036CbD53842c5426634e7929541eC2318f3dCF7c`
- **Use Case**: Development and testing

### 2. Base Mainnet
- **Chain ID**: 8453
- **Network**: Mainnet
- **RPC URL**: `https://mainnet.base.org`
- **USDC Address**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Use Case**: Production deployment

### 3. Hardhat Localhost
- **Chain ID**: 31337
- **Network**: Local development
- **RPC URL**: `http://127.0.0.1:8545`
- **USDC Address**: Deploy locally
- **Use Case**: Local development and testing

## Environment Variables

Configure your preferred network using these environment variables:

```bash
# Network Selection (default: baseSepolia)
NETWORK=baseSepolia

# RPC URLs
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
HARDHAT_RPC=http://127.0.0.1:8545

# Contract Addresses (optional - defaults provided)
USDC_CONTRACT_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7c
VAULT_CONTRACT_ADDRESS=0x... # Deploy your vault contract

# Relayer Configuration
RELAYER_PRIVATE_KEY=0x... # Private key of the relayer wallet
```

## Network Selection

The server will use the network specified in the `NETWORK` environment variable. Valid options are:

- `baseSepolia` (default)
- `base`
- `hardhat`

## Base Network Benefits

### Base Sepolia
- **Cost**: Very low transaction fees
- **Speed**: Fast finality
- **Security**: Built on Ethereum L2
- **Ecosystem**: Growing DeFi ecosystem
- **Bridge**: Easy bridging from Ethereum

### Base Mainnet
- **Production Ready**: Full mainnet deployment
- **Security**: Inherits Ethereum's security
- **Cost**: Low fees compared to Ethereum L1
- **Compatibility**: Full EVM compatibility

## Hardhat Local Development

For local development:

1. Start Hardhat node:
```bash
npx hardhat node
```

2. Set environment variables:
```bash
NETWORK=hardhat
HARDHAT_RPC=http://127.0.0.1:8545
```

3. Deploy contracts locally:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

## Migration Guide

### From Base Sepolia to Base Mainnet

1. Update environment variables:
```bash
NETWORK=base
BASE_MAINNET_RPC=https://mainnet.base.org
```

2. Deploy contracts to Base Mainnet:
```bash
npx hardhat run scripts/deploy.js --network base
```

## Troubleshooting

### Common Issues

1. **RPC Connection Failed**
   - Check RPC URL is correct
   - Verify network is accessible
   - Check firewall settings

2. **Contract Not Found**
   - Verify contract address is correct for the network
   - Ensure contract is deployed on the selected network

3. **Transaction Failures**
   - Check relayer wallet has sufficient gas
   - Verify relayer wallet has RELAYER_ROLE
   - Check network congestion

### Network-Specific Notes

- **Base Sepolia**: Use for testing, has testnet USDC
- **Base Mainnet**: Use for production, requires real USDC
- **Hardhat**: Use for local development, deploy your own USDC 