# SMAC Platform

A full-stack web platform for the Sports Modeling & Analytics Club at Miami University. SMAC gives members a central place to publish sports analytics articles, submit and track picks, view trader profiles, and manage club engagement through a virtual SMAC coins system.

Live app: [smacmu.com](https://smacmu.com)

This project was built to support a real student organization, with authenticated member workflows, admin-managed content, and database-backed sports analytics features.

## Features

- Member authentication with credential-based sign in and registration through NextAuth.
- Role-based navigation and API protection for admin-only workflows.
- Article publishing flow for user-submitted sports analysis, including draft/publication approval fields.
- Public article browsing with author attribution and recent-post rendering.
- SMAC picks system for official club picks, including sport, game, bet, odds, stake, week, year, and result tracking.
- User pick submission with SMAC coin balance checks and transactional balance updates.
- Trader pages for viewing member pick history and performance-oriented profiles.
- Article engagement features including voting, comments, and threaded replies in the data model.
- Image upload support for article assets.
- Supabase Edge Function for scheduled SMAC coin distribution.
- Shared resource link for club datasets, meeting materials, and Google Drive assets.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- PostgreSQL
- Prisma ORM
- Supabase
- NextAuth
- Tailwind CSS
- Vercel

## Architecture Overview

The app is organized around Next.js App Router pages and API routes:

- `src/app/page.tsx` renders the home page, shared resources, and recent articles.
- `src/components/Navbar.tsx` handles responsive navigation, auth state, and admin/member links.
- `src/app/api/auth/[...nextauth]/route.ts` configures credential login, password verification, JWT sessions, and custom user roles.
- `src/app/api/articles/*` manages article creation, publishing state, voting, and comments.
- `src/app/api/smac-picks/*` manages official club picks and admin-controlled results.
- `src/app/api/user-smac-picks/*` manages member-submitted picks and SMAC coin transactions.
- `src/app/api/traders/*` powers trader/member profile views.
- `prisma/schema.prisma` defines the core relational data model.
- `supabase/functions/distribute-coins` distributes SMAC coins through a secured scheduled function.

## Data Model Highlights

The Prisma schema includes models for:

- `User`: member account data, admin status, and SMAC coin balance.
- `SMACArticle`: sports analysis articles with game metadata, picks, reasoning, images, and publication status.
- `SMACPick`: official club picks created by admins.
- `UserSMACPick`: member-created picks with odds, stakes, results, yield, week, and year fields.
- `ArticleVote`: one-vote-per-user article voting.
- `ArticleComment`: threaded article comments and replies.
- `SMACCoinsDistribution`: configuration for scheduled coin distribution.

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL database
- Supabase project, if using Supabase services and edge functions

### Install Dependencies

```bash
npm install
```

### Configure Environment

Copy `env-template.txt` into `.env` or `.env.local` and provide values for:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET_KEY=
```

### Database Setup

Generate the Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

The project also includes a migration helper:

```bash
npm run migrate
```

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev       # Start the development server
npm run build     # Build for production
npm run start     # Start the production server
npm run lint      # Run linting
npm run migrate   # Run the migration helper script
```

## Project Highlights

- Built for an active student organization rather than as a standalone demo app.
- Combines full-stack product work with user accounts, permissions, content workflows, and transactional updates.
- Uses database indexes and relational modeling for member, article, pick, comment, and voting data.
- Supports AI-assisted development workflows while keeping the product architecture and implementation review under human control.

## Future Improvements

- Add analytics dashboards for model performance and pick history.
- Improve admin moderation tools for submitted articles and picks.
- Add automated tests for API routes and balance-update transactions.
- Expand trader profiles with richer historical performance metrics.
