# GrokTalk 🤖💬

A modern, full-stack AI chat application built with React, TypeScript, Express, and Supabase. GrokTalk provides a seamless interface for interacting with multiple AI providers including OpenAI, Anthropic, and X.AI through OpenRouter.

## ✨ Features

- **Multi-Provider AI Support**: Integrate with OpenAI, Anthropic, X.AI, and more through OpenRouter
- **Project-Based Organization**: Create custom AI assistants with specific instructions and capabilities
- **Secure API Key Management**: Encrypted storage of API keys with AES-256-GCM encryption
- **Real-time Chat Interface**: Modern, responsive chat UI with file upload support
- **Persistent Chat History**: Save and manage conversation history across sessions
- **User Authentication**: Secure JWT-based authentication system
- **Database Integration**: PostgreSQL database with Prisma ORM and Supabase
- **TypeScript**: Full type safety across frontend and backend
- **Modern UI**: Built with Tailwind CSS and Radix UI components

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Router** for navigation
- **React Query** for state management

### Backend
- **Express.js** with TypeScript
- **Prisma ORM** for database operations
- **PostgreSQL** (Supabase) for data storage
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Helmet** for security headers

### AI Integration
- **OpenRouter** for multi-provider AI access
- Support for OpenAI, Anthropic, X.AI, and more
- Streaming responses for real-time chat

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- OpenRouter API key for AI functionality

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd GrokTalk
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

```env
# Database (Supabase)
DATABASE_URL="your-supabase-database-url"
POSTGRES_URL="your-postgres-url"
SUPABASE_URL="your-supabase-project-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# API Configuration (Important for deployment)
VITE_API_BASE_URL="https://your-backend-api.vercel.app/api"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
ENCRYPTION_KEY="your-32-character-encryption-key-here"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

**Important**: Set `VITE_API_BASE_URL` to your deployed backend API URL to avoid CORS issues.

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Optional: Open Prisma Studio to view data
npm run db:studio
```

### 4. Start Development Servers
```bash
# Terminal 1: Start the frontend
npm run dev

# Terminal 2: Start the API server
npm run server:dev
```

The application will be available at:
- Frontend: http://localhost:8081
- Backend API: http://localhost:3001

## 🔧 Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server:dev` - Start backend development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## 🔒 Security Features

### API Key Encryption
- **AES-256-GCM**: Military-grade encryption for API keys
- **Unique IVs**: Each API key encrypted with unique initialization vector
- **Database Security**: Keys never stored in plain text

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: Bcrypt with configurable salt rounds
- **CORS Protection**: Configured for secure cross-origin requests
- **Helmet Security**: Security headers and protection middleware

## 📁 Project Structure

```
GrokTalk/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utility libraries
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── server/                # Backend source code
│   ├── routes/            # Express routes
│   └── index.ts           # Server entry point
├── prisma/                # Database schema
│   └── schema.prisma      # Prisma schema file
└── public/                # Static assets
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Chat History
- `GET /api/chat` - Get chat history
- `POST /api/chat` - Create chat
- `GET /api/chat/:id` - Get specific chat
- `PUT /api/chat/:id` - Update chat
- `DELETE /api/chat/:id` - Delete chat

### API Keys
- `GET /api/api-keys` - Get user API keys
- `POST /api/api-keys` - Create API key
- `PUT /api/api-keys/:id` - Update API key
- `DELETE /api/api-keys/:id` - Delete API key

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Set environment variables in your hosting platform:
   - `VITE_API_BASE_URL`: Your backend API URL (e.g., `https://your-backend.vercel.app/api`)
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
2. Build the project: `npm run build`
3. Deploy the `dist` folder

**Critical**: Ensure `VITE_API_BASE_URL` points to your deployed backend to avoid CORS errors.

### Backend (Railway/Heroku)
1. Set up environment variables
2. Run database migrations: `npm run db:push`
3. Deploy with: `npm run server`

### Database (Supabase)
1. Create a new Supabase project
2. Copy the connection strings to your `.env` file
3. Run `npm run db:push` to create tables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions, please:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include error logs and environment details

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for AI provider integration
- [Supabase](https://supabase.com/) for database and backend services
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Prisma](https://www.prisma.io/) for database ORM
