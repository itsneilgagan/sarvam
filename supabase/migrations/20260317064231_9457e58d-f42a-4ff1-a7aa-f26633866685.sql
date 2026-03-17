-- 1. Clean up duplicate triggers on services
DROP TRIGGER IF EXISTS services_search_vector_trigger ON public.services;
DROP TRIGGER IF EXISTS update_search_vector_trigger ON public.services;

-- Keep one canonical trigger
CREATE TRIGGER services_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- 2. Ensure GIN index on search_vector
CREATE INDEX IF NOT EXISTS idx_services_search_vector ON public.services USING gin(search_vector);

-- 3. Useful indexes
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_city ON public.services(city);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON public.services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);

-- 4. Auto-create profile trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, phone, role, dob)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    CASE WHEN NEW.raw_user_meta_data->>'dob' IS NOT NULL 
         THEN (NEW.raw_user_meta_data->>'dob')::date 
         ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    role = COALESCE(NULLIF(EXCLUDED.role, 'customer'), profiles.role);
  RETURN NEW;
END;
$$;

-- Drop if exists to recreate cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();