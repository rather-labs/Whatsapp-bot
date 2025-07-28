# Backend Server

A comprehensive backend server that provides user management, wallet functionality, and EVM blockchain integration for the WhatsApp bot system.

## Features

### 🔐 User Management
- User registration and blockchain integration
- Numeric PIN authentication (4-6 digits)
- User profiles with risk and auth levels
- **Centralized session management** with 5-minute inactivity timeout
- PIN-based session restoration

### 💰 Wallet System
- On-chain user registration via smart contracts
- USDC token management through vault system
- Vault deposits and withdrawals with yield generation
- Transaction processing with authorization levels

### 🌐 Blockchain Integration
- EVM-compatible blockchain support (Base network)
- Smart contract integration for user registration
- On-chain asset management
- Gas-optimized transactions via relayer pattern

### 🏦 Vault System
- Smart contract-based vault deposits
- Yield-generating deposits
- Configurable authorization profiles
- Risk management settings

### 🔒 Security Features
- PIN-based authentication
- Encrypted PIN storage
- **Centralized PIN validation** for session restoration
- **Session expiration handling** with automatic cleanup
- Authorization profiles for transaction approval
- **JWT authentication middleware** for all protected routes
- **Origin validation** for request source verification

## Installation

1. **Navigate to the backend server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   BACKEND_PORT=3002
   JWT_SECRET=your-super-secret
   NETWORK=baseSepolia
   BASE_SEPOLIA_RPC=https://sepolia.base.org
   BASE_MAINNET_RPC=https://mainnet.base.org
   USDC_CONTRACT_ADDRESS=0x...
   VAULT_CONTRACT_ADDRESS=0x... # Your deployed vault contract
   PRIVATE_KEY=0x... # Relayer wallet private key
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### User Management

#### GET `/api/users/check/:whatsapp_number`
Check if user is registered on blockchain.

#### GET `/api/users/data/:whatsapp_number`
Get user's on-chain data and balances.

#### POST `/api/users/register`
Register new user with blockchain integration.

### Session Management

#### POST `/api/users/session/validate`
Comprehensive session validation with PIN handling.

#### GET `/api/users/session/status/:whatsapp_number`
Get detailed session status for a user.

### Transfer Operations

#### POST `/api/transfers/pay`
Send USDC payment to another user or external wallet.

#### POST `/api/transfers/deposit`
Deposit USDC to vault for yield generation.

#### POST `/api/transfers/withdraw`
Withdraw USDC from vault.

### Ramp Operations

#### POST `/api/ramps/onramp`
Generate on-ramp URL for funding wallet.

#### POST `/api/ramps/offramp`
Generate off-ramp URL for converting to fiat.

### Contact Management

#### Contact endpoints for managing user contacts and wallet addresses

### System Status

#### GET `/api/health`
Health check endpoint.

## Database Schema

The server uses **Supabase** as the database with the following schema:

### Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  whatsapp_number TEXT PRIMARY KEY,
  username TEXT,
  encrypted_pin TEXT NOT NULL,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Contacts Table
```sql
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  user_whatsapp_number TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_whatsapp_number TEXT NOT NULL,
  contact_wallet_address TEXT,
  FOREIGN KEY (user_whatsapp_number) REFERENCES users (whatsapp_number) ON DELETE CASCADE
);
```

## Blockchain Configuration

### Supported Networks
- **Base Sepolia** (recommended for testing)
- **Base Mainnet** (for production deployment)

### Smart Contract Integration
The server integrates with deployed vault contracts for:
- User registration on-chain
- Asset management (USDC deposits/withdrawals)
- Authorization profile management
- Yield generation

### Gas Management
The server uses a relayer pattern for gasless user transactions.

## Security Considerations

### Production Deployment
1. **Use strong JWT secrets**
2. **Secure Supabase configuration**
3. **Implement proper encryption for private keys**
4. **Use HTTPS in production**
5. **Implement proper logging and monitoring**
6. **Regular security audits**

### Private Key Management
- Relayer private keys are used for on-chain operations
- Use hardware security modules (HSM) in production
- Implement key rotation policies
- Regular backup and recovery procedures

## Integration with WhatsApp Bot

The server integrates with the WhatsApp bot through HTTP API calls. The bot can:

1. Register users on blockchain
2. Query user balances and data
3. Execute transfers with authorization
4. Manage vault deposits/withdrawals
5. Handle session management

### Environment Variables for Integration
```env
BACKEND_SERVER_URL=http://localhost:3002
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please check the GitHub repository or create an issue. 