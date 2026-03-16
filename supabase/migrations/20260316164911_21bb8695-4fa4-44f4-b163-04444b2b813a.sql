
-- Enable RLS on all remaining public tables
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_skills ENABLE ROW LEVEL SECURITY;

-- Basic read policies for these tables
CREATE POLICY "Authenticated users can view assignments" ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view providers" ON public.providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view ratings" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view requests" ON public.requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Anyone can view provider_skills" ON public.provider_skills FOR SELECT USING (true);
