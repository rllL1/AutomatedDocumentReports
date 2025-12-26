# 🚀 Quick Start Guide

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to **SQL Editor**
3. Copy the entire contents of `backend/database/schema.sql`
4. Paste and execute in SQL Editor
5. Go to **Authentication > Users** and click "Add User"
   - Create an admin user with email and password
6. Copy the user ID from the users list
7. Go back to **SQL Editor** and run:
   ```sql
   INSERT INTO users (id, email, full_name, role, is_active)
   VALUES (
     'paste-your-user-id-here',
     'your-admin@example.com',
     'Admin Name',
     'admin',
     true
   );
   ```

### 3. Get Your API Keys

**Supabase:**
- Go to **Project Settings > API**
- Copy:
  - Project URL
  - `anon` `public` key
  - `service_role` `secret` key

**Gemini AI (FREE):**
- Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create a free API key (no credit card needed!)

### 4. Configure Environment Files

**Create `.env` in root:**
```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GEMINI_API_KEY=your-gemini-api-key

JWT_SECRET=your-random-secret-string-change-this

CORS_ORIGIN=http://localhost:3000
```

**Create `.env.local` in root:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Start the Application

**Option A: Run both frontend and backend together:**
```bash
npm run dev:all
```

**Option B: Run separately:**

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (Backend):
```bash
npm run dev:backend
```

### 6. Access the Application

- Open browser: http://localhost:3000
- Login with your admin credentials
- Start managing documents!

## 🎯 What You Get

✅ **Dashboard** - View statistics and recent uploads
✅ **Files** - Upload and manage documents with AI summaries
✅ **Utilities** - Configure form options dynamically
✅ **Users** - Manage user accounts
✅ **Profile** - Update your profile and password

## 📚 Next Steps

1. **Add Utilities**: Go to Utilities page and add your organization's:
   - Document classifications
   - Document types
   - Summary bases
   - Office divisions
   - Destination offices

2. **Create Users**: Go to Users page and add team members

3. **Upload Documents**: Go to Files > Add Document and start uploading!

## ⚠️ Common Issues

**"Cannot connect to backend"**
- Make sure backend is running on port 3001
- Check `.env` and `.env.local` are configured correctly

**"Authentication failed"**
- Verify Supabase credentials in `.env`
- Ensure admin user exists in both Auth and users table

**"AI processing failed"**
- Check Gemini API key is valid
- Gemini is completely FREE - no credits needed!

## 🆘 Need Help?

See the full [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed documentation.
