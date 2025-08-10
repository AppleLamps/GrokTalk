# GrokTalk Database Setup & Migration Guide

This guide will help you complete the setup of your GrokTalk application with database authentication and secure API key storage.

## 🚀 Quick Start

### 1. Database Setup (Supabase)

1. **Create Supabase Project**:
   - Go to `https://app.supabase.com`
   - Create a new project (e.g., `groktalk-db`)
   - Choose region close to Vercel deployment

2. **Get Supabase Keys**:
   - From Project Settings → API: copy Project URL, anon key, and service role key

3. **Update Environment Variables**:
    
    ```bash
    # Update your .env file
    POSTGRES_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
    POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR-ANON-KEY"
    POSTGRES_SUPABASE_SERVICE_ROLE_KEY="YOUR-SERVICE-ROLE-KEY"
    JWT_SECRET="your-secure-jwt-secret-32-chars-min"
    ENCRYPTION_KEY="your-32-character-encryption-key-here"
   ```

4. **Generate Secure Keys**:
   ```bash
   # Generate JWT secret (32+ characters)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Generate encryption key (32 characters exactly)
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```

### 2. Database Schema

Use Supabase SQL editor to create tables matching:

```sql
-- users are managed by Supabase Auth

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null,
  instructions text not null,
  conversation_starters text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  provider text not null,
  encrypted_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS policies
alter table public.projects enable row level security;
alter table public.chat_history enable row level security;
alter table public.user_api_keys enable row level security;

create policy "projects select" on public.projects for select using (auth.uid() = user_id);
create policy "projects ins" on public.projects for insert with check (auth.uid() = user_id);
create policy "projects upd" on public.projects for update using (auth.uid() = user_id);
create policy "projects del" on public.projects for delete using (auth.uid() = user_id);

create policy "chat select" on public.chat_history for select using (auth.uid() = user_id);
create policy "chat ins" on public.chat_history for insert with check (auth.uid() = user_id);
create policy "chat upd" on public.chat_history for update using (auth.uid() = user_id);
create policy "chat del" on public.chat_history for delete using (auth.uid() = user_id);

create policy "keys select" on public.user_api_keys for select using (auth.uid() = user_id);
create policy "keys ins" on public.user_api_keys for insert with check (auth.uid() = user_id);
create policy "keys upd" on public.user_api_keys for update using (auth.uid() = user_id);
create policy "keys del" on public.user_api_keys for delete using (auth.uid() = user_id);
```

### 3. Start the Application

```bash
# Terminal 1: Start the frontend
npm run dev

# Terminal 2: Start the API server
npm run server:dev
```

## 🔧 What's New

### Authentication System
- **User Registration/Login**: Secure authentication with JWT tokens
- **Password Security**: Bcrypt hashing with salt rounds
- **Session Management**: Automatic token validation and refresh

### Database Integration
- **User Management**: Secure user accounts with profiles
- **Project Storage**: Projects now stored in database with user association
- **Chat History**: Persistent chat history linked to users and projects
- **API Key Security**: Encrypted API key storage using AES-256-GCM

### Migration Features
- **Automatic Migration**: Existing localStorage data automatically migrated to database
- **Backward Compatibility**: Fallback to localStorage for unauthenticated users
- **Data Preservation**: No data loss during migration process

## 📱 User Experience

### First Time Setup
1. **Authentication**: Users see login/register form on first visit
2. **Migration**: Existing data automatically migrated after login
3. **API Keys**: Secure storage of API keys in encrypted database
4. **Projects**: All projects now user-specific and persistent

### New Features
- **User Profiles**: Manage account settings and preferences
- **Secure API Keys**: API keys encrypted and stored securely
- **Project Isolation**: Each user sees only their own projects
- **Chat History**: Persistent chat history across sessions

## 🔒 Security Features

### API Key Encryption
- **AES-256-GCM**: Military-grade encryption for API keys
- **Unique Salts**: Each API key encrypted with unique initialization vector
- **Database Security**: Keys never stored in plain text

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: Bcrypt with configurable salt rounds
- **CORS Protection**: Configured for secure cross-origin requests
- **Helmet Security**: Security headers and protection middleware

## 🛠️ Development

### Available Scripts
```bash
# Frontend
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend API
npm run server       # Start API server (production)
npm run server:dev   # Start API server (development with watch)

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio (database GUI)
```

### API Endpoints
```
# Authentication
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/me          # Get current user
PUT  /api/auth/profile     # Update user profile

# Projects
GET    /api/projects       # Get user projects
POST   /api/projects       # Create project
GET    /api/projects/:id   # Get specific project
PUT    /api/projects/:id   # Update project
DELETE /api/projects/:id   # Delete project

# Chat History
GET    /api/chat           # Get chat history
POST   /api/chat           # Create chat
GET    /api/chat/:id       # Get specific chat
PUT    /api/chat/:id       # Update chat
DELETE /api/chat/:id       # Delete chat

# API Keys
GET    /api/api-keys                    # Get user API keys
POST   /api/api-keys                    # Create API key
GET    /api/api-keys/provider/:provider # Get key by provider
PUT    /api/api-keys/:id                # Update API key
DELETE /api/api-keys/:id                # Delete API key
```

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check database connection
npx prisma db pull

# Reset database (⚠️ destroys data)
npx prisma migrate reset

# Check Prisma status
npx prisma status
```

### Migration Issues
- **Port Conflicts**: Ensure ports 3000 (frontend) and 3001 (API) are available
- **Environment Variables**: Verify all required env vars are set
- **Database Access**: Ensure Vercel Postgres allows connections

### Common Fixes
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npm run db:generate

# Check environment variables
echo $DATABASE_URL
```

## 📊 Database Schema

### Tables Created
- **User**: User accounts and profiles
- **UserApiKey**: Encrypted API keys by provider
- **Project**: User projects and configurations
- **ChatHistory**: Chat messages and conversations

### Relationships
- Users have many Projects
- Users have many UserApiKeys
- Users have many ChatHistory entries
- Projects can have associated ChatHistory

## 🎯 Next Steps

1. **Test Authentication**: Register a new account and verify login
2. **Create Projects**: Test project creation and management
3. **API Key Setup**: Add your API keys through the settings panel
4. **Chat Testing**: Verify chat functionality with new backend
5. **Migration Verification**: Check that old data was migrated correctly

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure database is accessible and migrations ran successfully
4. Check that both frontend and API servers are running

---

**🎉 Congratulations!** Your GrokTalk application now has:
- ✅ Secure user authentication
- ✅ Database-backed data storage
- ✅ Encrypted API key management
- ✅ Persistent chat history
- ✅ User-specific projects
- ✅ Automatic data migration