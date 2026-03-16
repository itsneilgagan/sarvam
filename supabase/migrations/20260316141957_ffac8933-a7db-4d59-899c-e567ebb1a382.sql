
-- Add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS category text;

-- Add new columns to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS provider_id uuid;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Indexes
CREATE INDEX IF NOT EXISTS services_search_idx ON services USING gin(search_vector);
CREATE INDEX IF NOT EXISTS services_provider_idx ON services(provider_id);

-- Search vector function and trigger
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.short_description, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS services_search_vector_trigger ON services;
CREATE TRIGGER services_search_vector_trigger
  BEFORE INSERT OR UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION public.update_search_vector();

-- Backfill search vectors for existing rows
UPDATE services SET title = title WHERE search_vector IS NULL;

-- Drop and recreate services RLS policies
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
DROP POLICY IF EXISTS "Authenticated users can insert services" ON services;
DROP POLICY IF EXISTS "Authenticated users can update services" ON services;
DROP POLICY IF EXISTS "Authenticated users can delete services" ON services;
DROP POLICY IF EXISTS "Providers can insert services" ON services;
DROP POLICY IF EXISTS "Providers can insert own services" ON services;
DROP POLICY IF EXISTS "Providers can update own services" ON services;
DROP POLICY IF EXISTS "Providers can delete own services" ON services;

CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Providers can insert services" ON services FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can update own services" ON services FOR UPDATE TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can delete own services" ON services FOR DELETE TO authenticated USING (auth.uid() = provider_id);

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;

CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('service-covers', 'service-covers', true) ON CONFLICT DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public service cover access" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload covers" ON storage.objects;

CREATE POLICY "Public avatar access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth users upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Public service cover access" ON storage.objects FOR SELECT USING (bucket_id = 'service-covers');
CREATE POLICY "Auth users upload covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'service-covers');
