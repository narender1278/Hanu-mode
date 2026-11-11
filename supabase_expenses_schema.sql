-- Run this once in Supabase SQL Editor to enable private, per-account expense tracking.
CREATE TABLE IF NOT EXISTS public.user_expenses (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL CHECK (char_length(btrim(category_name)) BETWEEN 1 AND 80),
    category_type TEXT NOT NULL CHECK (category_type IN ('income', 'expense', 'balance')),
    month_index INT NOT NULL CHECK (month_index BETWEEN 0 AND 21),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, category_name, month_index)
);

ALTER TABLE public.user_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own expenses" ON public.user_expenses;
CREATE POLICY "Users manage their own expenses"
    ON public.user_expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_expenses TO authenticated;
