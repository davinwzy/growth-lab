# Supabase Cloud Sync Design

## Problem
Teachers using Growth Lab lose data when switching devices or browsers because data is stored in localStorage.

## Solution
Add Supabase backend with Google login to enable cloud data sync, with minimal changes to existing codebase.

## Decisions
- **Backend**: Supabase free tier (500MB DB, 50K MAU)
- **Auth**: Google OAuth via Supabase Auth
- **Storage strategy**: Store entire AppState as JSON in a single `user_data` row per user
- **Local cache**: Keep localStorage as offline cache
- **Migration**: Detect existing localStorage data and offer to import to cloud on first login
- **Future**: Database schema reserves `role` field for student accounts (Phase 2)

## Database Schema

```sql
-- User profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text,
  display_name text,
  role text DEFAULT 'teacher',
  created_at timestamptz DEFAULT now()
);

-- App data (one JSON blob per user)
CREATE TABLE user_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data"
  ON user_data FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON user_data FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON user_data FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## User Flow

### First-time login
1. Open site -> See login page with "Sign in with Google" button
2. Click -> Google OAuth popup -> Authorized
3. Check localStorage for existing data
   - Has data -> Prompt: "Import local data to cloud?"
     - Yes -> Upload to Supabase, clear localStorage
     - No -> Start fresh
   - No data -> Enter system (empty state)

### Daily use
1. Open site -> Auto-detect Supabase session
   - Logged in -> Load data from cloud -> Normal use
   - Session expired -> Show login page
2. Every state change -> Auto-save to Supabase (debounced)
3. localStorage kept as local cache for fast loading

### Switch device
1. Open site on new device -> Google login -> Cloud data loads automatically

## Files to Change

| File | Change | Notes |
|------|--------|-------|
| `package.json` | Add `@supabase/supabase-js` | Only new dependency |
| **NEW** `src/lib/supabase.ts` | Supabase client init | Project URL + anon key |
| **NEW** `src/features/auth/AuthProvider.tsx` | Auth state context | Session management |
| **NEW** `src/features/auth/LoginPage.tsx` | Login UI | Google sign-in button |
| `src/shared/utils/storage.ts` | Add Supabase read/write | Keep localStorage as cache |
| `src/app/AppProvider.tsx` | Load from Supabase on init, save on change | Small changes only |
| `src/app/App.tsx` | Wrap AuthProvider, show LoginPage if not authed | Small changes only |

## Files NOT Changed
- All `features/` components
- All `services/` logic
- All `shared/types/`, `shared/utils/badges.ts`, `gamification.ts`
- Reducer logic, useGamification hook

## Supabase Setup Steps
1. Create Supabase project at supabase.com
2. Enable Google Auth provider in Supabase dashboard
3. Create Google OAuth credentials in Google Cloud Console
4. Run SQL schema in Supabase SQL editor
5. Copy project URL and anon key to `.env`

## Environment Variables
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
