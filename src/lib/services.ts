import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type Service = {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceInput = Omit<Service, 'id' | 'created_at' | 'updated_at'>;

export async function listServices(query?: string): Promise<Service[]> {
  try {
    let supabaseQuery = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (query && query.trim()) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
      return [];
    }

    return (data || []).map(item => ({
      ...item,
      tags: item.tags || [],
    }));
  } catch (error) {
    console.error('Error:', error);
    toast({
      title: "Error",
      description: "Something went wrong while loading services",
      variant: "destructive",
    });
    return [];
  }
}

export async function createService(payload: ServiceInput): Promise<Service | null> {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert({
        title: payload.title,
        description: payload.description,
        category: payload.category,
        price: payload.price,
        currency: payload.currency || 'INR',
        tags: payload.tags || [],
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Success",
      description: "Service created successfully",
    });

    return {
      ...data,
      tags: data.tags || [],
    };
  } catch (error: any) {
    console.error('Error:', error);
    toast({
      title: "Error",
      description: error.message || "Something went wrong",
      variant: "destructive",
    });
    return null;
  }
}

export async function updateService(id: string, patch: Partial<ServiceInput>): Promise<Service | null> {
  try {
    const { data, error } = await supabase
      .from('services')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Success",
      description: "Service updated successfully",
    });

    return {
      ...data,
      tags: data.tags || [],
    };
  } catch (error: any) {
    console.error('Error:', error);
    toast({
      title: "Error",
      description: error.message || "Something went wrong",
      variant: "destructive",
    });
    return null;
  }
}

export async function deleteService(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Success",
      description: "Service deleted successfully",
    });

    return true;
  } catch (error: any) {
    console.error('Error:', error);
    toast({
      title: "Error",
      description: error.message || "Something went wrong",
      variant: "destructive",
    });
    return false;
  }
}
