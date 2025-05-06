# Big Boys Game - Architecture Overview

## 1. Overview

Big Boys Game is a full-stack web application implementing a multiplayer betting game. The application follows a modern client-server architecture with a React frontend and Express.js backend. It leverages real-time communication via WebSockets for game state synchronization and uses PostgreSQL (via Neon's serverless offering) for data persistence.

The game allows users to:
- Register and authenticate
- Deposit and withdraw funds via Stripe integration
- Create and join game lobbies
- Play against other users or bots
- Chat during games
- Track transaction history and game statistics

## 2. System Architecture

### 2.1 High-Level Architecture

The system follows a three-tier architecture:

1. **Client Tier**: React-based SPA with UI components from shadcn/ui
2. **Server Tier**: Express.js API server with WebSocket support
3. **Data Tier**: PostgreSQL database (via Neon's serverless offering)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  Client (React) │───▶│  Server (Node)  │───▶│  Database (PG)  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                     ▲
        │                     │
        └─────────────────────┘
           WebSocket (ws)
```

### 2.2 Code Organization

The repository is organized with a clear separation between client and server code:

```
/
├── client/                # Frontend code
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Page components
│   │   └── ...
├── server/                # Backend code
│   ├── game/              # Game logic
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── ...
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
└── ...
```

## 3. Key Components

### 3.1 Frontend

The frontend is built with:

- **React**: Core UI library
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI
- **React Query**: Data fetching and state management
- **Wouter**: Lightweight routing library
- **React Hook Form**: Form handling with Zod validation

Key frontend components include:

- **Authentication**: Login/register forms with session management
- **Game Board**: Interactive UI for the game with real-time updates
- **Wallet**: Interface for managing funds, including deposits and withdrawals
- **Dashboard**: Player statistics and game history

### 3.2 Backend

The backend is built with:

- **Express.js**: Web framework for handling HTTP requests
- **WebSocket**: Real-time communication protocol
- **Drizzle ORM**: Database ORM for PostgreSQL
- **Zod**: Schema validation

Key backend components include:

- **Auth System**: User authentication and session management
- **Game Manager**: Core game logic and state management
- **WebSocket Server**: Real-time communication for game updates
- **Payment Processing**: Integration with Stripe for deposits and withdrawals

### 3.3 Database

The application uses a PostgreSQL database with the following main tables:

- **users**: User accounts with authentication and wallet information
- **games**: Game instances with configuration and state
- **gamePlayers**: Many-to-many relationship between users and games
- **transactions**: Financial transactions for deposits, withdrawals, and game stakes
- **messages**: In-game chat messages

## 4. Data Flow

### 4.1 Authentication Flow

1. User submits credentials through the login/register form
2. Server validates credentials and creates a session
3. Session is stored in cookies and maintained across requests
4. Protected routes check for valid session

### 4.2 Game Flow

1. User creates or joins a game through the UI
2. Server initializes game state and notifies all players
3. WebSocket connection is established for real-time updates
4. Game proceeds with turns, with each action propagated to all players
5. Game concludes, funds are transferred, and results are displayed

### 4.3 Payment Flow

1. User initiates deposit or withdrawal from wallet page
2. For deposits, Stripe checkout session is created
3. User completes payment on Stripe-hosted page
4. Stripe webhooks notify the server of successful payment
5. User's wallet balance is updated accordingly

## 5. External Dependencies

### 5.1 Third-Party Services

- **Stripe**: Payment processing for deposits
- **Neon Database**: Serverless PostgreSQL database

### 5.2 Key Libraries

#### Frontend
- **@radix-ui**: Low-level UI primitives
- **@tanstack/react-query**: Data fetching and caching
- **@stripe/react-stripe-js**: Stripe integration components
- **tailwindcss**: Utility CSS framework

#### Backend
- **drizzle-orm**: Database ORM
- **bcrypt**: Password hashing
- **ws**: WebSocket server implementation
- **stripe**: Stripe API client

## 6. Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Build Process**: Vite builds the frontend, esbuild bundles the server
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16 (via Replit's PostgreSQL integration)
- **Environment Variables**: Required for database connection, Stripe API keys, etc.

The deployment workflow includes:
1. Building the frontend with Vite
2. Bundling the server with esbuild
3. Serving static assets from the server
4. Running database migrations at startup

### 6.1 Scaling Considerations

- The current architecture allows for horizontal scaling of the web server
- Real-time communication via WebSockets creates challenges for load balancing
- Database scaling relies on Neon's serverless capabilities

## 7. Security Considerations

- **Authentication**: Password hashing with bcrypt
- **Payment Security**: Reliance on Stripe for secure payment processing
- **API Security**: Input validation with Zod schemas
- **Session Management**: Secure cookies for maintaining user sessions

## 8. Future Improvements

- Implement more sophisticated game mechanics
- Add comprehensive admin dashboard
- Enhance real-time capabilities with Socket.io or similar
- Implement more payment options
- Add social features like friends lists and private games