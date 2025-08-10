# Database Setup Guide

This guide will help you set up Vercel Postgres for your GrokTalk application.

## Prerequisites

- Vercel account
- Project deployed to Vercel (or ready to deploy)

## Step 1: Create Vercel Postgres Database

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to the "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Choose a database name (e.g., `groktalk-db`)
7. Select your preferred region
8. Click "Create"

## Step 2: Get Database Connection String

1. After creating the database, go to the "Settings" tab of your database
2. Copy the connection string from the "Connection String" section
3. It should look like: `postgresql://username:password@host:port/database?sslmode=require`

## Step 3: Update Environment Variables

### For Local Development

1. Update your `.env` file:
```env
# Replace with your actual Vercel Postgres connection string
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Generate secure secrets (you can use: openssl rand -base64 32)
JWT_SECRET="your-jwt-secret-here"
ENCRYPTION_KEY="your-32-character-encryption-key"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### For Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:
   - `DATABASE_URL`: Your Vercel Postgres connection string
   - `JWT_SECRET`: A secure random string
   - `ENCRYPTION_KEY`: A 32-character encryption key
   - `NEXTAUTH_SECRET`: A secure random string
   - `NEXTAUTH_URL`: Your production URL

## Step 4: Run Database Migration

Once you have the correct `DATABASE_URL`:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Or run migrations (alternative)
npm run db:migrate
```

## Step 5: Verify Database Setup

```bash
# Open Prisma Studio to view your database
npm run db:studio
```

## Step 6: Start the Application

```bash
# Start the development server
npm run dev

# In another terminal, start the API server
npm run server:dev
```

## Database Schema

The application uses the following models:

- **User**: Stores user accounts with email, password, and profile info
- **UserApiKey**: Stores encrypted API keys for different providers
- **Project**: Stores user projects with settings and configurations
- **ChatHistory**: Stores chat messages and conversations

## Troubleshooting

### Connection Issues
- Ensure your `DATABASE_URL` is correct
- Check that your Vercel Postgres database is active
- Verify SSL mode is set to `require`

### Migration Issues
- Try `npm run db:push` instead of `npm run db:migrate`
- Ensure Prisma client is generated: `npm run db:generate`

### Environment Variables
- Make sure all required environment variables are set
- Use strong, unique secrets for production
- Never commit `.env` files to version control

## Security Notes

- API keys are encrypted using AES-256-GCM
- Passwords are hashed using bcryptjs
- JWT tokens are used for authentication
- All database connections use SSL

## Next Steps

After setting up the database:

1. Update frontend contexts to use API endpoints
2. Implement user authentication flow
3. Migrate existing localStorage data to database
4. Test all CRUD operations

For any issues, check the server logs and ensure all environment variables are properly configured.