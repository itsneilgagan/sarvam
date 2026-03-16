import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { mapSupabaseError } from "@/lib/errors";

export type Service = {
  id: string;
  title: string;
  description: string;
  short_description?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  tags: string[];
  is_active: boolean;
  provider_id?: string | null;
  cover_image_url?: string | null;
  city?: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceInput = Omit<Service, 'id' | 'created_at' | 'updated_at'>;

interface ListOptions {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  limit?: number;
  providerId?: string;
}

export async function listServices(options?: ListOptions): Promise<Service[]> {
  try {
    let q: any = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (options?.query?.trim()) {
      const search = options.query.trim();
      q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (options?.category && options.category !== 'All') {
      q = q.eq('category', options.category);
    }
    if (options?.minPrice !== undefined) {
      q = q.gte('price', options.minPrice);
    }
    if (options?.maxPrice !== undefined) {
      q = q.lte('price', options.maxPrice);
    }
    if (options?.city) {
      q = q.eq('city', options.city);
    }
    if (options?.providerId) {
      q = q.eq('provider_id', options.providerId);
    }
    if (options?.limit) {
      q = q.limit(options.limit);
    }

    const { data, error } = await q;

    if (error) {
      console.error('Error fetching services:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      tags: item.tags || [],
    }));
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function listProviderServices(providerId: string): Promise<Service[]> {
  try {
    const q: any = supabase
      .from('services')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    const { data, error } = await q;

    if (error) return [];

    return (data || []).map((item: any) => ({
      ...item,
      tags: item.tags || [],
    }));
  } catch {
    return [];
  }
}

export async function getService(id: string): Promise<Service | null> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return { ...(data as any), tags: (data as any).tags || [] };
  } catch {
    return null;
  }
}

export async function createService(payload: ServiceInput): Promise<Service | null> {
  try {
    const { data, error }: any = await supabase
      .from('services')
      .insert({
        title: payload.title,
        description: payload.description,
        category: payload.category,
        price: payload.price,
        currency: payload.currency || 'INR',
        tags: payload.tags || [],
        is_active: payload.is_active ?? true,
        provider_id: payload.provider_id,
        cover_image_url: payload.cover_image_url,
        city: payload.city,
        short_description: payload.short_description,
      } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create service. Please try again.", variant: "destructive" });
      return null;
    }

    toast({ title: "Success", description: "Service published successfully!" });
    return { ...data, tags: data.tags || [] };
  } catch {
    toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    return null;
  }
}

export async function updateService(id: string, patch: Partial<ServiceInput>): Promise<Service | null> {
  try {
    const { data, error }: any = await supabase
      .from('services')
      .update(patch as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to update service.", variant: "destructive" });
      return null;
    }

    toast({ title: "Success", description: "Service updated!" });
    return { ...data, tags: data.tags || [] };
  } catch {
    toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    return null;
  }
}

export async function deleteService(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete service.", variant: "destructive" });
      return false;
    }
    toast({ title: "Deleted", description: "Service removed." });
    return true;
  } catch {
    toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    return false;
  }
}

export async function uploadServiceCover(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  const { error } = await supabase.storage.from('service-covers').upload(fileName, file);
  if (error) {
    toast({ title: "Upload Error", description: "Failed to upload image.", variant: "destructive" });
    return null;
  }

  const { data } = supabase.storage.from('service-covers').getPublicUrl(fileName);
  return data.publicUrl;
}
