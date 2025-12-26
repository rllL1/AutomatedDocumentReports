# 📄 Automated Document Management System

A secure admin-managed document management system with AI-powered document analysis and structured summary generation.

## 🧱 Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Storage**: Supabase Storage
- **AI Service**: OpenAI GPT-4

## ✨ Features

### 🔐 Authentication & Security
- Admin-only login (no public registration)
- JWT-based authentication with Supabase
- Secure token validation on all API requests
- Row-level security policies

### 📊 Dashboard
- Total documents statistics
- AI reports generated count
- Total users
- Recent uploads list

### 📁 Document Management
- Multi-step document upload form
- File support: PDF, DOCX, TXT
- AI-powered text extraction
- Automatic summary generation based on selected basis
- Complete CRUD operations
- Document classification and categorization

### 🤖 AI Processing
- Automatic text extraction from uploaded documents
- Context-aware summary generation
- Structured JSON output:
  - Overview
  - Basis analysis
  - Key points
  - Detailed findings
  - Conclusion

### 🧰 Utilities Management
- Dynamic form options management
- CRUD operations for:
  - Classifications
  - Document types
  - Summary bases
  - Division offices
  - Destination offices

### 👥 Users Management
- Create, edit, delete users
- Toggle user status (enable/disable)
- Role management (admin/user)
- Password management

### 👤 Profile Management
- Update profile information
- Change password
- View account details

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Gemini API key (FREE)

## 🚀 Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd automated-docs-system
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema:
   - Go to SQL Editor in Supabase Dashboard
   - Copy and execute the SQL from `backend/database/schema.sql`
3. Create the storage bucket:
   - Go to Storage in Supabase Dashboard
   - The schema script creates the 'documents' bucket automatically
   - Ensure RLS policies are enabled

### 3. Create Admin User

In Supabase SQL Editor:

```sql
-- Create admin in Supabase Auth first through Authentication > Users > Add User
-- Then insert into users table:
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  'auth-user-id-from-supabase',
  'admin@example.com',
  'Admin User',
  'admin',
  true
);
```

### 4. Configure Environment Variables

**Backend (.env):**

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

GEMINI_API_KEY=your_gemini_api_key

JWT_SECRET=your_secure_jwt_secret

CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env.local):**

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the Application

**Development Mode (Both Frontend & Backend):**

```bash
npm run dev:all
```

**Or run separately:**

Frontend:
```bash
npm run dev
```

Backend:
```bash
npm run dev:backend
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/health

### 7. Login

Use the admin credentials you created in Step 3:
- Email: `admin@example.com`
- Password: (the password you set in Supabase Auth)

## 📁 Project Structure

```
automated-docs-system/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── dashboard/        # Dashboard page
│   │   ├── files/            # Files management
│   │   │   ├── add/          # Multi-step document form
│   │   │   └── [id]/         # View document details
│   │   ├── utilities/        # Utilities CRUD
│   │   ├── users/            # Users management
│   │   └── profile/          # Profile page
│   ├── login/                # Login page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home redirect
├── backend/
│   ├── config/               # Configuration files
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Auth & error middleware
│   ├── routes/               # API routes
│   ├── services/             # AI & business logic
│   ├── types/                # TypeScript types
│   ├── database/             # Database schema
│   └── server.ts             # Express server
├── components/               # React components
├── contexts/                 # React contexts
├── lib/                      # Utilities
└── public/                   # Static files
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Dashboard
- `GET /api/dashboard/stats` - Get statistics

### Documents
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document by ID
- `POST /api/documents` - Upload and process document
- `DELETE /api/documents/:id` - Delete document

### Utilities
- `GET /api/utilities` - Get all utilities
- `GET /api/utilities/:type` - Get utilities by type
- `POST /api/utilities` - Create utility
- `PUT /api/utilities/:id` - Update utility
- `DELETE /api/utilities/:id` - Delete utility

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/toggle-status` - Toggle user status
- `DELETE /api/users/:id` - Delete user

## 🔒 Security Features

- JWT authentication on all protected routes
- Supabase Row Level Security (RLS)
- Admin-only access control
- Secure password handling
- CORS configuration
- File type validation
- File size limits (10MB)

## 🤖 AI Integration

The system uses Google Gemini 1.5 Flash (completely FREE) to:
1. Extract text from uploaded documents (PDF, DOCX, TXT)
2. Analyze content based on selected summary basis
3. Generate structured summaries with:
   - Overview
   - Basis-specific analysis
   - Key points (3-5 items)
   - Detailed findings
   - Conclusion

## 🎨 UI Components

- Responsive sidebar navigation
- Multi-step form wizard
- Data tables with CRUD operations
- Modal dialogs
- Toast notifications
- Loading states
- Error handling

## 🐛 Troubleshooting

### Backend won't start
- Ensure all environment variables are set
- Check Supabase credentials
- Verify OpenAI API key

### Frontend can't connect to backend
- Verify backend is running on port 3001
- Check NEXT_PUBLIC_API_URL in .env.local
- Ensure CORS is configured correctly

### AI processing fails
- Verify Gemini API key
- Gemini is FREE - no billing issues!
- Check file format (PDF, DOCX, TXT only)
- Ensure file is not corrupted

### Authentication errors
- Clear browser localStorage
- Verify Supabase URL and keys
- Check if admin user exists in database

## 📝 License

This project is private and proprietary.

## 🤝 Support

For issues or questions, contact the development team.
