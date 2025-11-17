# Mailing App

An automated email outreach application for newly registered companies. Supports creating separate email flows for different PKD codes (Polish Classification of Activities).

## Key Features

- Automatic monitoring of new companies via KRS API
- Personalized email flows by PKD codes
- Gmail integration via OAuth
- Subscription management via Stripe
- Multi-language support (EN, PL, RU)

## Installation & Setup

1. Install dependencies:

```bash
yarn install
```

2. Create a `.env` file based on `.env.example` and fill in the required environment variables:
   - Database credentials (Supabase)
   - Google OAuth credentials
   - Stripe API keys
   - QStash credentials
   - Sentry DSN

3. Run database migrations:

```bash
yarn db:migrate
```

4. Start the development server:

```bash
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Database Migrations

The project uses a custom wrapper for Drizzle Kit (`scripts/drizzle-wrapper.ts`) that automatically adds PostgreSQL functions and triggers to migrations.

To create a new migration, use:

```bash
yarn db:generate
```

The wrapper automatically:

- Extracts custom functions and triggers from the schema
- Tracks changes via snapshots
- Adds only modified entities to the migration
