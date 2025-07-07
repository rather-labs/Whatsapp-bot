# WhatsApp Bot Server - Modular Architecture

## Overview

The server is organized in a modular structure for improved maintainability, testability, and scalability.

## Directory Structure

```
server/
├── src/
│   ├── config/           # Configuration modules
│   │   ├── database.js   # Database setup and initialization
│   │   └── blockchain.js # Blockchain provider and network config
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # JWT authentication middleware
│   │   └── security.js   # Rate limiting and security middleware
│   ├── routes/           # API route modules
│   │   ├── health.js     # Health check endpoints
│   │   ├── users.js      # User management (registration, login, profiles)
│   │   ├── wallet.js     # Wallet operations (balance, payments, buy/sell)
│   │   ├── vault.js      # Vault operations (deposits, withdrawals)
│   │   ├── transactions.js # Transaction history
│   │   └── contacts.js   # Contact management
│   ├── services/         # Business logic services
│   │   └── sessionService.js # Session management and PIN validation
│   ├── utils/            # Utility functions
│   │   ├── crypto.js     # PIN encryption/decryption and wallet generation
│   │   └── timestamp.js  # Timestamp formatting and session expiration
│   └── app.js           # Main Express application setup
├── server.js            # Modular server entry point
└── ARCHITECTURE.md      # This documentation
```

## Module Responsibilities

### Configuration Modules (`src/config/`)

- **`database.js`**: SQLite database connection, table initialization, and graceful shutdown
- **`blockchain.js`**: Ethereum provider setup, network configuration, and USDC contract settings

### Middleware Modules (`src/middleware/`)

- **`auth.js`**: JWT token validation middleware
- **`security.js`**: Rate limiting and security headers

### Route Modules (`src/routes/`)

- **`health.js`**: Health check and system status endpoints
- **`users.js`**: User registration, login, session management, and profile operations
- **`wallet.js`**: Wallet balance, payments, and buy/sell operations
- **`vault.js`**: Vault deposits, withdrawals, and deposit history
- **`transactions.js`**: Transaction history and pagination
- **`contacts.js`**: Contact CRUD operations

### Service Modules (`src/services/`)

- **`sessionService.js`**: Session management, PIN validation, and user activity tracking

### Utility Modules (`src/utils/`)

- **`crypto.js`**: PIN encryption/decryption and wallet generation functions
- **`timestamp.js`**: UTC timestamp formatting and session expiration logic

## Benefits of Modular Architecture

### 1. **Separation of Concerns**
- Each module has a single, well-defined responsibility
- Business logic is separated from route handling
- Configuration is isolated from application logic

### 2. **Maintainability**
- Easier to locate and fix issues
- Changes to one feature don't affect others
- Clear module boundaries reduce coupling

### 3. **Testability**
- Individual modules can be unit tested in isolation
- Mock dependencies easily
- Better test coverage and organization

### 4. **Scalability**
- New features can be added as new modules
- Existing modules can be enhanced independently
- Team members can work on different modules simultaneously

### 5. **Code Reusability**
- Utility functions can be shared across modules
- Common middleware can be reused
- Configuration can be shared

## Development Guidelines

### Adding New Features

1. **New Routes**: Create a new file in `src/routes/`
2. **New Services**: Add to `src/services/`
3. **New Utilities**: Add to `src/utils/`
4. **New Configuration**: Add to `src/config/`

### Module Dependencies

- Routes can depend on services and utilities
- Services can depend on utilities and config
- Utilities should be independent
- Config modules should be independent

### Error Handling

- Each module should handle its own errors appropriately
- Use consistent error response formats
- Log errors for debugging

### Testing

- Unit tests should be created for each module
- Integration tests for route modules
- Mock external dependencies (database, blockchain)

## Environment Variables

The modular structure requires the following environment variables:

- `BACKEND_PORT`: Server port (default: 3002)
- `JWT_SECRET`: JWT signing secret
- `SEPOLIA_RPC`: Sepolia testnet RPC URL
- `POLYGON_RPC`: Polygon mainnet RPC URL
- `USDC_CONTRACT_ADDRESS`: USDC contract address
- `NETWORK`: Current network (sepolia/polygon)

## Performance Considerations

- Database connections are shared across modules
- Blockchain provider is singleton
- Rate limiting is applied globally
- Compression and security middleware are applied at the app level

## Security

- All security middleware is applied at the application level
- Authentication is required for protected routes
- Rate limiting prevents abuse
- Input validation is handled in route modules
- PIN encryption uses secure algorithms

## Monitoring and Logging

- Health check endpoint provides system status
- Database connection status is logged
- Blockchain connection status is logged
- Error logging is centralized

This modular architecture provides a solid foundation for future development. 