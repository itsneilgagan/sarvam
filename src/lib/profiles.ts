import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Profile } from "@/hooks/useAuth";

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as unknown as Profile;
}

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update(patch as any)
    .eq('id', userId);

  if (error) {
    toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    return false;
  }

  toast({ title: "Saved", description: "Profile updated successfully." });
  return true;
}

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (error) {
    toast({ title: "Upload Error", description: "Failed to upload avatar.", variant: "destructive" });
    return null;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return data.publicUrl;
}
