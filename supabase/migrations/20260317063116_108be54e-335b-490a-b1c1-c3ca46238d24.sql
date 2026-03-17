-- Allow providers to also see their own services (even inactive ones)
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true OR auth.uid() = provider_id);

-- Create the search_vector trigger if not exists
DROP TRIGGER IF EXISTS update_search_vector_trigger ON public.services;
CREATE TRIGGER update_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();