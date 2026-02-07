# Real-Time Bidding System

A high-concurrency, full-stack real-time bidding system built with Node.js, Next.js, and PostgreSQL.

## Tech Stack
- **Backend**: Node.js, TypeScript, Express, Socket.io, Prisma ORM
- **Frontend**: Next.js 14+, Tailwind CSS, Zustand, Socket.io-client
- **Database**: PostgreSQL (with Row-Level Locking for race conditions)
- **DevOps**: Docker, Docker Compose

## Core Features
- **Real-Time Updates**: Instant price and bidder updates via WebSockets.
- **Race Condition Handling**: Uses PostgreSQL `SELECT FOR UPDATE` to ensure data integrity during high-frequency bidding.
- **RBAC**: Admin can create/start auctions; Dealers can place bids.
- **Modern UI**: Premium dark mode design with responsive layouts.

## Prerequisites
- Docker & Docker Compose

## Quick Start (with Docker)
1. Clone the repository.
2. Run the entire stack:
   ```bash
   docker-compose up --build
   ```
3. Open `http://localhost:3000` in your browser.
4. Use the **Quick Login** buttons to sign in as a Dealer or Admin.

## Manual Setup (Development)
### Backend
1. `cd backend`
2. `npm install`
3. Setup `.env` (copy from `.env.example`)
4. `npx prisma db push`
5. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Handling Race Conditions
The system handles race conditions at the database level using **Row-Level Locking**. In `bidService.ts`, we wrap the bidding logic in a transaction and use `$queryRaw` with `FOR UPDATE` on the specific auction row. This ensures that only one bid can be processed at a time for a given auction, preventing skipped price increments or double-awards.
