REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_income(NUMERIC, TEXT, TEXT, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_income(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_income(NUMERIC, TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_income(UUID) TO authenticated;