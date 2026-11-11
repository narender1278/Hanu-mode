-- =============================================================================
-- 🚀 STUDY COMPANION - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Project -> SQL Editor
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TOPICS TABLE (Master Curriculum)
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,                       -- e.g. '1.1.01'
    section TEXT NOT NULL,                     -- e.g. '1. Python'
    subsection TEXT NOT NULL,                  -- e.g. '1.1 Language fundamentals'
    title TEXT NOT NULL,                       -- e.g. 'Python execution model; bytecode...'
    priority TEXT DEFAULT 'P0',                -- 'P0', 'P1', etc.
    notes_markdown TEXT,                       -- Cached Gemini study notes
    notes_doc_url TEXT,                        -- Optional Google Doc URL
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile entry when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. USER PROGRESS TABLE (Personal spaced repetition for each friend)
CREATE TABLE IF NOT EXISTS public.user_progress (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Not started',         -- 'Not started', 'Can explain'
    date_learned DATE,
    revisions_done INT DEFAULT 0,
    last_revised DATE,
    next_revision DATE,
    last_score TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);

-- 4. QUIZ HISTORY TABLE (Tracks past quiz scores and timestamps)
CREATE TABLE IF NOT EXISTS public.quiz_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    score INT NOT NULL,
    total INT NOT NULL,
    is_revision BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_history ENABLE ROW LEVEL SECURITY;

-- Topics: Any authenticated user can read; service role can insert/update
CREATE POLICY "Allow public read on topics" ON public.topics
    FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow service role update on topics" ON public.topics
    FOR ALL TO service_role USING (true);

-- Profiles: Users can read all profiles (to see friends) and update their own
CREATE POLICY "Allow read profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow user update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User Progress: Each user can only select, insert, and update their own progress
CREATE POLICY "Allow users to read their own progress" ON public.user_progress
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own progress" ON public.user_progress
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own progress" ON public.user_progress
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Quiz History: Users can view and log their own quiz history
CREATE POLICY "Allow users to read their own quiz history" ON public.quiz_history
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert quiz history" ON public.quiz_history
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
