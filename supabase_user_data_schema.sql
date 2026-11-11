-- Run this once in Supabase SQL Editor for synchronized per-user app data.
CREATE TABLE IF NOT EXISTS public.user_app_data (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_key TEXT NOT NULL CHECK (char_length(data_key) BETWEEN 1 AND 160),
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, data_key)
);

ALTER TABLE public.user_app_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own app data" ON public.user_app_data;
CREATE POLICY "Users manage their own app data"
    ON public.user_app_data
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_app_data TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'user_app_data'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_app_data;
    END IF;

    IF to_regclass('public.user_expenses') IS NOT NULL
       AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'user_expenses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_expenses;
    END IF;
END
$$;
