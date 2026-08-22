-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  occupation TEXT,
  avatar_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  preferred_currency TEXT NOT NULL DEFAULT 'INR',
  theme TEXT NOT NULL DEFAULT 'light',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  monthly_expense_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- JARS
CREATE TABLE public.jars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  jar_name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'piggy-bank',
  color TEXT NOT NULL DEFAULT 'violet',
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jars TO authenticated;
GRANT ALL ON public.jars TO service_role;
ALTER TABLE public.jars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jars_own" ON public.jars FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX jars_user_idx ON public.jars(user_id);

-- GOALS
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  jar_id UUID REFERENCES public.jars(id) ON DELETE SET NULL,
  goal_name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'target',
  target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  deadline DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_own" ON public.goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX goals_user_idx ON public.goals(user_id);

-- INCOME
CREATE TABLE public.income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  source TEXT NOT NULL DEFAULT 'Other',
  notes TEXT,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  allocated_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income TO authenticated;
GRANT ALL ON public.income TO service_role;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "income_own" ON public.income FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX income_user_date_idx ON public.income(user_id, income_date DESC);

-- EXPENSES
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Other',
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_own" ON public.expenses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX expenses_user_date_idx ON public.expenses(user_id, expense_date DESC);

-- JAR ALLOCATIONS (savings history)
CREATE TABLE public.jar_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  jar_id UUID NOT NULL REFERENCES public.jars(id) ON DELETE CASCADE,
  income_id UUID REFERENCES public.income(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  allocated_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jar_allocations TO authenticated;
GRANT ALL ON public.jar_allocations TO service_role;
ALTER TABLE public.jar_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jar_allocations_own" ON public.jar_allocations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX jar_alloc_user_date_idx ON public.jar_allocations(user_id, allocated_on DESC);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER jars_updated BEFORE UPDATE ON public.jars FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER income_updated BEFORE UPDATE ON public.income FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER expenses_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- New user bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, occupation)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'occupation'
  );

  INSERT INTO public.jars (user_id, jar_name, icon, color, percentage) VALUES
    (NEW.id, 'Emergency Fund', 'shield', 'violet', 20),
    (NEW.id, 'Family Support', 'heart', 'pink', 15),
    (NEW.id, 'Investment', 'trending-up', 'blue', 10),
    (NEW.id, 'Vehicle', 'bike', 'amber', 10);

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.id, 'Welcome to GigSave', 'Add your first income to start saving automatically.', 'info');

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atomic income + jar allocation
CREATE OR REPLACE FUNCTION public.record_income(
  p_amount NUMERIC,
  p_source TEXT,
  p_notes TEXT,
  p_income_date DATE
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_income UUID;
  v_total NUMERIC := 0;
  r RECORD;
  v_share NUMERIC;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

  INSERT INTO public.income (user_id, amount, source, notes, income_date)
  VALUES (v_user, p_amount, COALESCE(NULLIF(p_source, ''), 'Other'), NULLIF(p_notes, ''), COALESCE(p_income_date, CURRENT_DATE))
  RETURNING id INTO v_income;

  FOR r IN SELECT id, percentage FROM public.jars WHERE user_id = v_user AND percentage > 0 LOOP
    v_share := ROUND(p_amount * r.percentage / 100.0, 2);
    IF v_share > 0 THEN
      UPDATE public.jars SET balance = balance + v_share WHERE id = r.id;
      INSERT INTO public.jar_allocations (user_id, jar_id, income_id, amount, allocated_on)
      VALUES (v_user, r.id, v_income, v_share, COALESCE(p_income_date, CURRENT_DATE));
      v_total := v_total + v_share;
    END IF;
  END LOOP;

  UPDATE public.income SET allocated_amount = v_total WHERE id = v_income;

  UPDATE public.goals g
  SET current_amount = LEAST(g.target_amount, j.balance),
      is_completed = (j.balance >= g.target_amount)
  FROM public.jars j
  WHERE g.jar_id = j.id AND g.user_id = v_user;

  RETURN v_income;
END; $$;

REVOKE ALL ON FUNCTION public.record_income(NUMERIC, TEXT, TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_income(NUMERIC, TEXT, TEXT, DATE) TO authenticated;

-- Reverse an income entry (used on delete)
CREATE OR REPLACE FUNCTION public.delete_income(p_income_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  r RECORD;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.income WHERE id = p_income_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'Income not found';
  END IF;

  FOR r IN SELECT jar_id, amount FROM public.jar_allocations WHERE income_id = p_income_id AND user_id = v_user LOOP
    UPDATE public.jars SET balance = GREATEST(0, balance - r.amount) WHERE id = r.jar_id;
  END LOOP;

  DELETE FROM public.income WHERE id = p_income_id AND user_id = v_user;

  UPDATE public.goals g
  SET current_amount = LEAST(g.target_amount, j.balance),
      is_completed = (j.balance >= g.target_amount)
  FROM public.jars j
  WHERE g.jar_id = j.id AND g.user_id = v_user;
END; $$;

REVOKE ALL ON FUNCTION public.delete_income(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_income(UUID) TO authenticated;