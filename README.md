# Big Boys Game 🎮

A sophisticated multiplayer online gambling platform featuring real-time stone-rolling games with voice chat, secure payments, and professional admin controls.

## 🌟 Features

### 🎯 Core Gaming
- **Multiplayer Stone Rolling Games** - 2-10 players compete with virtual stones
- **Bot Games** - Play against AI with special multipliers
- **Real-time Gameplay** - Live updates and synchronized game states
- **Multiple Stone Types** - Regular (1-6), Special (500/1000), Super (3355/6624)

### 🎙️ Communication
- **Voice Chat Integration** - Agora.io powered voice chat for premium games
- **Real-time Chat** - Text messaging during gameplay
- **Professional UI** - Enhanced voice chat interface for high-stake games

### 💰 Financial System
- **Secure Payments** - Paystack integration for Nigerian users
- **Multi-currency Support** - Global currency handling
- **Instant Deposits** - Real-time balance updates
- **Fast Withdrawals** - 24-48 hour processing to verified accounts
- **Commission System** - Tiered rates (5%-20% based on game type)

### 🏆 Monthly Lottery System
- **Special Multipliers** - Admin can activate 2x/3x multipliers monthly
- **Limited Activation** - Once per calendar month restriction
- **Automatic Reset** - Permission resets at month start
- **Player Notifications** - Clear lottery status indicators

### 🔐 Security & Admin
- **Professional Admin Dashboard** - Complete platform management
- **User Management** - Balance adjustments, account controls
- **Game Statistics** - Comprehensive analytics and reporting
- **Maintenance Mode** - System-wide maintenance controls
- **Transaction Monitoring** - Real-time financial oversight

### 📱 Mobile Responsive
- **Touch-friendly Interface** - Optimized for mobile devices
- **Hamburger Navigation** - Smooth mobile menu experience
- **Responsive Design** - Works perfectly on all screen sizes

### 📧 Communication
- **Email Verification** - Secure account activation
- **Password Reset** - Secure password recovery system
- **Transaction Notifications** - Email confirmations for all financial activities

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/UI** component library
- **Wouter** for routing
- **TanStack Query** for state management
- **React Hook Form** for form handling
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **WebSocket** for real-time communication
- **PostgreSQL** with Drizzle ORM
- **Session-based Authentication**
- **bcrypt** for password hashing

### External Services
- **Agora.io** - Voice chat functionality
- **Paystack** - Payment processing
- **SendGrid** - Email services
- **Neon Database** - PostgreSQL hosting

## 🏗️ Architecture

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── layouts/        # Page layouts
├── server/                 # Express backend
│   ├── routes/             # API route handlers
│   │   ├── admin.ts        # Admin management
│   │   ├── paystack.ts     # Payment processing
│   │   ├── bot-games.ts    # Bot game logic
│   │   └── transactions.ts # Financial operations
│   ├── game/               # Game logic
│   ├── utils/              # Server utilities
│   └── migrations/         # Database migrations
├── shared/                 # Shared types and schemas
└── public/                 # Static assets
```

## 🎮 Game Rules

### Stone Types & Values
- **Regular Stones**: 1, 2, 3, 4, 5, 6
- **Special Stones**: 500, 1000 (yellow background)
- **Super Stones**: 3355, 6624 (red background, gold border)

### Winning Logic
- Highest number wins the entire pot
- Multiple winners split the pot equally
- Platform commission deducted before payout
- Winner stones display with special animations

### Commission Structure
- **5%** for games under ₦10,000
- **10%** for games ₦10,000 and above
- **20%** for bot games

### Voice Chat Tiers
- **₦20,000+** - Voice chat enabled
- **₦50,000+** - Premium voice chat UI

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Required API keys (see below)

### Environment Variables
```env
DATABASE_URL=your_postgresql_url
SESSION_SECRET=your_session_secret
PAYSTACK_SECRET_KEY=your_paystack_secret
PAYSTACK_PUBLIC_KEY=your_paystack_public
AGORA_APP_ID=your_agora_app_id
SENDGRID_API_KEY=your_sendgrid_key
```

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/big-boys-game.git
cd big-boys-game

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## 🎯 Key Features Walkthrough

### 🎮 Creating a Game
1. Select stake amount and currency
2. Set maximum players (2-10)
3. Game automatically starts when enough players join
4. Voice chat activates for premium games

### 🎲 Playing a Game
1. Join an available game
2. Wait for your turn to roll
3. Click "Roll Stone" button
4. View results and potential winnings
5. Chat with other players

### 💰 Managing Finances
1. Deposit via Paystack integration
2. Monitor balance in real-time
3. Withdraw to verified bank accounts
4. View transaction history

### 👑 Admin Controls
1. Access admin dashboard at `/admin`
2. Manage user accounts and balances
3. Monitor game statistics
4. Control maintenance mode
5. Activate monthly lottery multipliers

## 🏆 Monthly Lottery System

The platform features a unique monthly lottery system:

- **Admin Control**: Only admins can activate multipliers
- **Limited Use**: Once per calendar month
- **Multiplier Options**: 2x or 3x for all multiplayer games
- **Automatic Reset**: Permission resets monthly
- **Player Visibility**: Clear notifications when active

## 🔐 Security Features

### Authentication
- Secure session-based authentication
- Password hashing with bcrypt
- Email verification required
- Password reset functionality

### Financial Security
- Encrypted payment processing
- Transaction logging
- Balance verification
- Withdrawal verification

### Admin Security
- Admin-only access controls
- Activity logging
- Maintenance mode capability

## 📱 Mobile Experience

The platform is fully optimized for mobile devices:
- Touch-friendly game controls
- Responsive card layouts
- Mobile navigation menu
- Optimized spacing for thumb navigation

## 🌍 Global Support

### Multi-currency
- Support for multiple currencies
- Automatic currency detection
- Local payment methods
- Regional bank support

### Communication
- Professional email templates
- Multi-language support ready
- Global voice chat integration

## 🔄 Future Enhancements

- [ ] Tournament system
- [ ] Leaderboards
- [ ] Social features
- [ ] Mobile app
- [ ] Additional payment methods
- [ ] Advanced analytics

## 📞 Support

For support and inquiries:
- Email: support@bigboysgame.com
- Phone: +234 901 234 5678
- Location: Victoria Island, Lagos, Nigeria

## 📄 License

This project is proprietary software. All rights reserved.

---

**Big Boys Game** - Where strategy meets excitement! 🎮🏆