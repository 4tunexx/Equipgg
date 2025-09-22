# EquipGG - CS2 Gaming Platform

A comprehensive Counter-Strike 2 gaming platform featuring betting, inventory management, case opening, and community features.

## Features

### 🎮 Gaming & Betting
- **Coinflip Games**: Head-to-head betting with provably fair outcomes
- **Match Betting**: Bet on professional CS2 matches with real-time odds
- **Case Opening**: Open CS2 weapon cases with animated reveals
- **Trade-Up Contracts**: Exchange lower-tier items for higher-tier ones

### 👤 User System
- **Steam Authentication**: Secure login via Steam OpenID
- **User Profiles**: Customizable profiles with stats and achievements
- **XP & Leveling**: Gain experience and level up through activities
- **Prestige System**: Advanced progression for dedicated players

### 🎒 Inventory & Economy
- **Virtual Inventory**: Manage CS2 skins and items
- **Balance Management**: Secure virtual currency system
- **Shop**: Purchase items and cases
- **Item Trading**: Exchange items with other users

### 🏆 Social & Community
- **Live Chat**: Real-time chat with moderation
- **Leaderboards**: Compete with other players
- **Achievements**: Unlock badges and rewards
- **Mission System**: Complete daily and weekly challenges

### 🛡️ Security & Fair Play
- **Provably Fair**: Cryptographic verification for all games
- **Rate Limiting**: Protection against abuse
- **Session Management**: Secure user sessions
- **Admin Dashboard**: Comprehensive moderation tools

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Steam OpenID, Custom JWT
- **Real-time**: Socket.IO for live features
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Steam API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Equipgg
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with:
- Supabase credentials
- Steam API key
- JWT secrets
- Other required API keys

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── dashboard/      # Main application pages
│   └── auth/           # Authentication pages
├── components/         # Reusable React components
├── lib/               # Utility functions and configurations
├── hooks/             # Custom React hooks
├── contexts/          # React context providers
├── types/             # TypeScript type definitions
└── sockets/           # Socket.IO event handlers
```

## Key Features Implementation

### Authentication Flow
- Steam OpenID integration
- JWT token management
- Session repair mechanisms
- Secure logout handling

### Game Logic
- Provably fair random number generation
- Real-time game state management
- Betting validation and processing
- Inventory item management

### Admin Features
- User management dashboard
- Financial transaction monitoring
- Site maintenance controls
- Security event logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please contact the development team.

