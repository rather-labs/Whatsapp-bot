# Blockchain Server

A comprehensive blockchain server that provides user management, wallet functionality, and EVM blockchain integration for the WhatsApp bot system.

## Features

### 🔐 User Management
- User registration and authentication
- JWT-based authentication
- Numeric PIN authentication (4-6 digits)
- User profiles with risk and auth levels

### 💰 Wallet System
- Automatic wallet generation for new users
- USDC token management
- ETH balance tracking
- Vault deposits with yield generation
- Transaction history and tracking

### 🌐 Blockchain Integration
- EVM-compatible blockchain support (Ethereum, Polygon)
- USDC token transfers
- On-chain transaction execution
- Gas estimation and management
- Multi-network support

### 🏦 Vault System
- Yield-generating vault deposits
- Configurable APY rates
- Deposit and withdrawal functionality
- Risk profile management

### 🔒 Security Features
- Rate limiting
- Helmet security headers
- Input validation
- Encrypted private key storage
- JWT token management

## Installation

1. **Navigate to the blockchain server directory:**
   ```bash
   cd blockchain-server
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
   BLOCKCHAIN_PORT=3002
   JWT_SECRET=your-super-secret-jwt-key
   NETWORK=sepolia
   SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   USDC_CONTRACT_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
   ```

4. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

#### POST `/api/users/register`
Register a new user with wallet creation.

**Request Body:**
```json
{
  "whatsapp_number": "1234567890",
  "username": "john_doe",
  "pin": 1234
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "userId": "uuid",
  "walletAddress": "0x..."
}
```

#### POST `/api/users/login`
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "whatsapp_number": "1234567890",
  "pin": 1234
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "whatsapp_number": "1234567890",
    "username": "john_doe",
    "wallet_address": "0x..."
  }
}
```

### User Management

#### GET `/api/users/profile`
Get user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": "uuid",
  "whatsapp_number": "1234567890",
  "username": "john_doe",
  "wallet_address": "0x...",
  "risk_profile": "moderate",
  "auth_profile": "basic",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### POST `/api/users/risk-profile`
Update user risk profile (requires authentication).

**Request Body:**
```json
{
  "risk_profile": "high"
}
```

### Wallet Operations

#### GET `/api/wallet/balance`
Get wallet balance (requires authentication).

**Response:**
```json
{
  "wallet_address": "0x...",
  "balance_usdc": 1000.0,
  "balance_eth": 0.1,
  "vault_balance": 500.0,
  "onchain_usdc": 1000.0
}
```

#### POST `/api/wallet/pay`
Send USDC payment (requires authentication).

**Request Body:**
```json
{
  "amount": 100,
  "recipient": "0x..."
}
```

**Response:**
```json
{
  "message": "Payment sent successfully",
  "transactionId": "uuid",
  "txHash": "0x...",
  "amount": 100,
  "recipient": "0x..."
}
```

#### POST `/api/wallet/buy`
Buy USDC tokens (requires authentication).

**Request Body:**
```json
{
  "amount": 100
}
```

#### POST `/api/wallet/sell`
Sell USDC tokens (requires authentication).

**Request Body:**
```json
{
  "amount": 50
}
```

### Vault Operations

#### POST `/api/vault/deposit`
Deposit USDC to vault (requires authentication).

**Request Body:**
```json
{
  "amount": 200
}
```

**Response:**
```json
{
  "message": "Deposited to vault successfully",
  "depositId": "uuid",
  "transactionId": "uuid",
  "amount": 200,
  "apy": 0.05
}
```

#### POST `/api/vault/withdraw`
Withdraw USDC from vault (requires authentication).

**Request Body:**
```json
{
  "amount": 100
}
```

#### GET `/api/vault/deposits`
Get vault deposits (requires authentication).

### Transaction History

#### GET `/api/transactions`
Get transaction history (requires authentication).

**Query Parameters:**
- `limit`: Number of transactions (default: 10)
- `offset`: Offset for pagination (default: 0)

### System Status

#### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "network": "Sepolia Testnet",
  "database": "connected",
  "blockchain": "connected"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  whatsapp_number TEXT UNIQUE NOT NULL,
  username TEXT,
  email TEXT,
  password_hash TEXT,
  wallet_address TEXT,
  private_key_encrypted TEXT,
  risk_profile TEXT DEFAULT 'moderate',
  auth_profile TEXT DEFAULT 'basic',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Wallets Table
```sql
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  private_key_encrypted TEXT,
  balance_usdc REAL DEFAULT 0,
  balance_eth REAL DEFAULT 0,
  vault_balance REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tx_hash TEXT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  recipient TEXT,
  status TEXT DEFAULT 'pending',
  gas_used INTEGER,
  gas_price TEXT,
  block_number INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Vault Deposits Table
```sql
CREATE TABLE vault_deposits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  apy REAL DEFAULT 0.05,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## Blockchain Configuration

### Supported Networks
- **Sepolia Testnet** (default)
- **Polygon Mainnet**

### USDC Contract
The server supports USDC token operations on EVM-compatible networks. Configure the contract address in your environment variables.

### Gas Management
The server automatically estimates gas costs for transactions and handles gas price optimization.

## Security Considerations

### Production Deployment
1. **Use strong JWT secrets**
2. **Implement proper encryption for private keys**
3. **Add rate limiting and DDoS protection**
4. **Use HTTPS in production**
5. **Implement proper logging and monitoring**
6. **Regular security audits**

### Private Key Management
- Private keys are encrypted before storage
- Use hardware security modules (HSM) in production
- Implement key rotation policies
- Regular backup and recovery procedures

## Development

### Project Structure
```
blockchain-server/
├── server.js              # Main server file
├── package.json           # Dependencies
├── env.example           # Environment template
├── database.sqlite       # SQLite database
└── README.md            # This file
```

### Key Dependencies
- `express` - Web framework
- `ethers` - Ethereum library
- `sqlite3` - Database
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting

### Testing
```bash
# Run tests (when implemented)
npm test

# Health check
curl http://localhost:3002/api/health
```

## Integration with WhatsApp Bot

The blockchain server integrates with the WhatsApp bot through HTTP API calls. The bot can:

1. Register users automatically
2. Query wallet balances
3. Execute transactions
4. Manage vault deposits
5. Handle user authentication

### Environment Variables for Integration
```env
BLOCKCHAIN_SERVER_URL=http://localhost:3002
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please check the GitHub repository or create an issue. 