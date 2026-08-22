-- ADMIN USERS TABLE
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can read the admin_users table
CREATE POLICY "admin_users_read_own" ON public.admin_users 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Service role can do everything (for super admin operations)
CREATE POLICY "admin_users_service_role" ON public.admin_users 
  FOR ALL TO service_role 
  USING (true) WITH CHECK (true);

CREATE INDEX admin_users_user_idx ON public.admin_users(user_id);

-- Trigger for updated_at
CREATE TRIGGER admin_users_updated BEFORE UPDATE ON public.admin_users 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to check if a user is an admin (callable from client)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
END; $$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.admin_users WHERE user_id = auth.uid();
  RETURN v_role;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_admin_role() TO authenticated;

-- Platform stats function (admin only, bypasses RLS via security definer)
CREATE OR REPLACE FUNCTION public.admin_get_platform_stats()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_income', (SELECT COALESCE(SUM(amount), 0) FROM public.income),
    'total_expenses', (SELECT COALESCE(SUM(amount), 0) FROM public.expenses),
    'total_savings', (SELECT COALESCE(SUM(balance), 0) FROM public.jars),
    'total_goals', (SELECT COUNT(*) FROM public.goals),
    'completed_goals', (SELECT COUNT(*) FROM public.goals WHERE is_completed = true),
    'users_today', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE),
    'income_today', (SELECT COALESCE(SUM(amount), 0) FROM public.income WHERE income_date = CURRENT_DATE),
    'expenses_today', (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE expense_date = CURRENT_DATE)
  ) INTO v_result;

  RETURN v_result;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_get_platform_stats() TO authenticated;

-- Admin function to list all users with their profiles
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT json_build_object(
    'users', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          p.id,
          p.full_name,
          p.occupation,
          p.phone,
          p.preferred_currency,
          p.preferred_language,
          p.created_at,
          p.updated_at,
          (SELECT COALESCE(SUM(i.amount), 0) FROM public.income i WHERE i.user_id = p.id) as total_income,
          (SELECT COALESCE(SUM(e.amount), 0) FROM public.expenses e WHERE e.user_id = p.id) as total_expenses,
          (SELECT COALESCE(SUM(j.balance), 0) FROM public.jars j WHERE j.user_id = p.id) as total_savings,
          (SELECT COUNT(*) FROM public.goals g WHERE g.user_id = p.id) as goals_count,
          (SELECT a.role FROM public.admin_users a WHERE a.user_id = p.id) as admin_role
        FROM public.profiles p
        WHERE (p_search IS NULL OR p.full_name ILIKE '%' || p_search || '%' OR p.occupation ILIKE '%' || p_search || '%')
        ORDER BY p.created_at DESC
        LIMIT p_limit OFFSET p_offset
      ) t
    ),
    'total_count', (
      SELECT COUNT(*) FROM public.profiles p
      WHERE (p_search IS NULL OR p.full_name ILIKE '%' || p_search || '%' OR p.occupation ILIKE '%' || p_search || '%')
    )
  ) INTO v_result;

  RETURN v_result;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_list_users(INT, INT, TEXT) TO authenticated;

-- Admin function to get detailed user info
CREATE OR REPLACE FUNCTION public.admin_get_user_detail(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = p_user_id),
    'jars', (SELECT json_agg(row_to_json(j)) FROM public.jars j WHERE j.user_id = p_user_id),
    'goals', (SELECT json_agg(row_to_json(g)) FROM public.goals g WHERE g.user_id = p_user_id),
    'recent_income', (
      SELECT json_agg(row_to_json(i)) 
      FROM (SELECT * FROM public.income WHERE user_id = p_user_id ORDER BY income_date DESC LIMIT 10) i
    ),
    'recent_expenses', (
      SELECT json_agg(row_to_json(e)) 
      FROM (SELECT * FROM public.expenses WHERE user_id = p_user_id ORDER BY expense_date DESC LIMIT 10) e
    ),
    'stats', json_build_object(
      'total_income', (SELECT COALESCE(SUM(amount), 0) FROM public.income WHERE user_id = p_user_id),
      'total_expenses', (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE user_id = p_user_id),
      'total_savings', (SELECT COALESCE(SUM(balance), 0) FROM public.jars WHERE user_id = p_user_id),
      'income_count', (SELECT COUNT(*) FROM public.income WHERE user_id = p_user_id),
      'expense_count', (SELECT COUNT(*) FROM public.expenses WHERE user_id = p_user_id)
    )
  ) INTO v_result;

  RETURN v_result;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_detail(UUID) TO authenticated;