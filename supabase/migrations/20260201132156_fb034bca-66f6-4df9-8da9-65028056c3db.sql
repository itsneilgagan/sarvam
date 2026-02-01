-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NULL,
  price NUMERIC NULL,
  currency TEXT DEFAULT 'INR',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_services_title ON public.services(title);
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_tags ON public.services USING GIN(tags);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read, authenticated write)
CREATE POLICY "Anyone can view active services"
  ON public.services
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert services"
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update services"
  ON public.services
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete services"
  ON public.services
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_services_updated_at();

-- Seed data with sample services
INSERT INTO public.services (title, description, category, price, currency, tags, is_active) VALUES
  ('Home Cleaning', 'Professional deep cleaning for your home including kitchen, bathrooms, and living areas.', 'Cleaning', 500, 'INR', ARRAY['cleaning', 'home', 'deep-clean'], true),
  ('Plumbing Repair', 'Fix leaky faucets, clogged drains, pipe repairs and all plumbing issues.', 'Plumbing', 300, 'INR', ARRAY['plumbing', 'repair', 'emergency'], true),
  ('Electrical Work', 'Licensed electrician for wiring, fixture installation, and electrical repairs.', 'Electrical', 400, 'INR', ARRAY['electrical', 'wiring', 'installation'], true),
  ('AC Service & Repair', 'Air conditioner maintenance, gas refill, and repair services.', 'Appliances', 600, 'INR', ARRAY['ac', 'cooling', 'maintenance'], true),
  ('Painting Services', 'Interior and exterior painting with premium quality paints.', 'Painting', 800, 'INR', ARRAY['painting', 'interior', 'exterior'], true),
  ('Carpentry Work', 'Custom furniture, repairs, and all woodwork solutions.', 'Carpentry', 450, 'INR', ARRAY['carpentry', 'furniture', 'wood'], true),
  ('Pest Control', 'Complete pest control treatment for cockroaches, termites, and rodents.', 'Cleaning', 700, 'INR', ARRAY['pest', 'control', 'hygiene'], true),
  ('Gardening & Landscaping', 'Garden maintenance, plant care, and landscaping design.', 'Outdoor', 350, 'INR', ARRAY['garden', 'plants', 'outdoor'], true);