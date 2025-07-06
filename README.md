# Lurking Finance Pilot

A comprehensive financial management application with React frontend and Node.js backend.

## Project Structure

```
lurking-finance-pilot/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities and API
│   │   └── integrations/    # Supabase integration
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # Node.js backend
│   ├── src/
│   │   └── telegram-bot.js  # Telegram bot integration
│   └── package.json
├── supabase/                 # Supabase configuration
└── package.json             # Root package.json for scripts
```

## Features

- **Dashboard**: Overview of financial data with interactive charts
- **Expense Tracking**: Add, view, and delete transactions (latest 5 with delete functionality)
- **Stock Portfolio**: Manage stock holdings and track performance
- **Telegram Bot**: Automated notifications and interactions
- **Authentication**: Secure user authentication via Supabase
- **Real-time Updates**: Live data synchronization

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
# Copy .env.example to .env and fill in your values
cp .env.example .env
```

3. Start the development servers:
```bash
# Start frontend only
npm run dev

# Start telegram bot only
npm run start:bot

# Start both with tunnel
npm run dev:all
```

## Available Scripts

- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run start:bot` - Start telegram bot
- `npm run dev:all` - Start both frontend and bot with tunnel
- `npm run install:all` - Install dependencies for all packages

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI components
- React Router for navigation
- React Query for data fetching

### Backend
- Node.js with Express
- Supabase for database and authentication
- Telegram Bot API
- RESTful API architecture

### Database
- PostgreSQL via Supabase
- Row Level Security (RLS)
- Real-time subscriptions
