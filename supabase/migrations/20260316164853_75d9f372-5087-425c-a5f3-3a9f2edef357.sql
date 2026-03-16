
-- Wipe all data for fresh testing
TRUNCATE TABLE public.services RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;

-- Recreate storage buckets (idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-covers', 'service-covers', true) ON CONFLICT DO NOTHING;

-- Reset storage policies
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public service cover access" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload service covers" ON storage.objects;

CREATE POLICY "Public avatar access" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Public service cover access" ON storage.objects 
FOR SELECT USING (bucket_id = 'service-covers');

CREATE POLICY "Authenticated users can upload service covers" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'service-covers' AND auth.role() = 'authenticated');
