# Smart Wallet Frontend

A Next.js web application providing user registration and transaction authorization interfaces for the WhatsApp Bot Smart Wallet system. Built with React, TypeScript, and Coinbase's OnChainKit for blockchain integration.

**Note: This is a Proof of Concept implementation. Some features like on-ramp and off-ramp services are currently disabled.**

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Running backend server (see `../server/` for setup)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🌐 Features

### User Registration
- **Route**: `/register`
- Complete user registration with PIN setup
- Blockchain integration for on-chain user registration
- WhatsApp number validation and verification

### Authorization Pages
The frontend provides secure authorization interfaces for various wallet operations:

- **`/actions/transfer`** - Authorize USDC transfers to other users or external wallets
- **`/actions/deposit`** - Authorize vault deposits for yield generation
- **`/actions/withdraw`** - Authorize vault withdrawals
- **`/actions/changeAuth`** - Modify user authentication profile settings
- **`/actions/changeRisk`** - Update user risk profile preferences
- **`/actions/changeAuthThres`** - Set authorization thresholds for transactions

### Ramp Services (Currently Disabled)
- **`/actions/onramp`** - On-ramp interface (shows "unavailable" message)
- **`/actions/offramp`** - Off-ramp interface (shows "unavailable" message)

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3002

# Blockchain Configuration (optional - for direct blockchain calls)
NEXT_PUBLIC_NETWORK=baseSepolia
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_BASE_MAINNET_RPC=https://mainnet.base.org

# Smart Contract Addresses (if needed for frontend operations)
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS=0x...
```

## 🏗️ Architecture

The frontend communicates with the backend server via REST API calls:

```
┌─────────────────┐    HTTP API    ┌──────────────────┐
│   Frontend      │◄──────────────►│ Backend Server   │
│   (Port 3000)   │                │   (Port 3002)    │
└─────────────────┘                └──────────────────┘
         │                                   │
         │                                   │
    User Interface                  ┌────────┴────────┐
         │                          │                 │
    Wallet Connect                  │   Supabase DB   │
                                    │  EVM Blockchain │
                                    └─────────────────┘
```

## 🛠️ Project Structure

```
frontend/
├── app/
│   ├── actions/              # Authorization pages
│   │   ├── transfer/         # USDC transfer authorization
│   │   ├── deposit/          # Vault deposit authorization
│   │   ├── withdraw/         # Vault withdrawal authorization
│   │   ├── changeAuth/       # Auth profile modification
│   │   ├── changeRisk/       # Risk profile modification
│   │   ├── changeAuthThres/  # Auth threshold settings
│   │   ├── onramp/           # On-ramp interface (disabled)
│   │   └── offramp/          # Off-ramp interface (disabled)
│   ├── components/           # Reusable React components
│   │   ├── Header.tsx        # Application header
│   │   ├── Footer.tsx        # Application footer
│   │   ├── SignTransaction.tsx # Transaction signing component
│   │   └── OnChainKitButton.tsx # Coinbase OnChainKit integration
│   ├── context/              # React context providers
│   ├── register/             # User registration page
│   ├── utils/                # Utility functions and types
│   ├── layout.tsx            # Root layout component
│   ├── page.tsx              # Home page
│   ├── providers.tsx         # App-wide providers
│   └── globals.css           # Global styles
├── lib/
│   ├── api.ts               # Backend API integration
│   └── auth.ts              # Authentication utilities
├── public/                  # Static assets
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── wagmi.ts               # Wagmi configuration for wallet integration
└── package.json           # Dependencies and scripts
```

## 🔐 API Integration

The frontend communicates with the backend server through the following key endpoints:

### User Management
- `GET /api/users/check/:whatsapp_number` - Check user registration status
- `GET /api/users/data/:whatsapp_number` - Get user data and balances
- `POST /api/users/register` - Register new user

### Session Management
- `POST /api/users/session/validate` - Validate user session with PIN
- `GET /api/users/session/status/:whatsapp_number` - Get session status

### Transaction Authorization
- `POST /api/transfers/pay` - Authorize USDC payment
- `POST /api/transfers/deposit` - Authorize vault deposit
- `POST /api/transfers/withdraw` - Authorize vault withdrawal

### Profile Management
- `POST /api/users/profile/auth` - Update authentication profile
- `POST /api/users/profile/risk` - Update risk profile

## 🔒 Security Features

- **Session Validation**: Secure PIN-based authentication for user sessions
- **Transaction Authorization**: Multi-level approval system based on user preferences
- **Wallet Integration**: Secure connection with user wallets via Coinbase OnChainKit
- **Input Validation**: Client-side and server-side validation for all user inputs
- **HTTPS Enforcement**: Secure communication with backend services

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first responsive layout using Tailwind CSS
- **Modern UI**: Clean, intuitive interface optimized for mobile devices
- **Loading States**: Proper loading indicators during API calls and blockchain transactions
- **Error Handling**: User-friendly error messages and fallback states
- **Accessibility**: WCAG-compliant components and navigation

## 🧪 Development

### Available Scripts

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Deploy to Vercel
npm run vercel:deploy
```

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Coinbase OnChainKit, Viem
- **HTTP Client**: Axios
- **Build Tool**: Turbopack (development)

### Development Workflow

1. **Start Backend**: Ensure the backend server is running on port 3002
2. **Install Dependencies**: `npm install`
3. **Environment Setup**: Configure `.env.local` with proper API URLs
4. **Development Server**: `npm run dev`
5. **Access Application**: Open `http://localhost:3000`

## 🚀 Deployment

### Vercel (Recommended)

The project is configured for easy deployment to Vercel:

```bash
# Deploy to Vercel
npm run vercel:deploy
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Configuration

Ensure the following environment variables are set in your deployment:

- `NEXT_PUBLIC_API_URL` - Backend server URL
- Other blockchain and contract configuration as needed

## ⚠️ Current Limitations

### Proof of Concept Status
- **On-ramp services**: Currently disabled pending external service integration
- **Off-ramp services**: Currently disabled pending compliance setup
- **Limited testing**: Primarily tested on Base Sepolia testnet


## 🔮 Future Enhancements

- [ ] Complete on-ramp/off-ramp service integration
- [ ] Enhanced mobile UI/UX optimizations
- [ ] Multi-language support

### Development Tips

- Use browser developer tools to monitor API calls
- Check the Network tab for failed requests
- Review console logs for client-side errors
- Ensure backend server logs for API debugging

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request
