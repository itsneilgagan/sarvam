import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile, uploadAvatar } from '@/lib/profiles';
import { listProviderServices, deleteService, Service } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import LocationModal from '@/components/LocationModal';
import ServiceCard from '@/components/ServiceCard';
import { EditServiceModal } from '@/components/EditServiceModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User, MapPin, Camera, Loader2, Plus, AlertTriangle } from 'lucide-react';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const avatarRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [upserting, setUpserting] = useState(false);

  // Provider services
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  // Profile completion
  const completion = useMemo(() => {
    if (!profile) return { percent: 0, missing: [] as string[] };
    const checks: [boolean, string][] = [
      [!!profile.full_name, 'Full Name'],
      [!!profile.phone, 'Phone'],
      [!!profile.city, 'City'],
      [!!profile.avatar_url, 'Avatar'],
    ];
    if (profile.role === 'provider') {
      checks.push([!!profile.business_name, 'Business Name']);
      checks.push([!!profile.bio, 'Bio']);
    }
    const done = checks.filter(([ok]) => ok).length;
    const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
    return { percent: Math.round((done / checks.length) * 100), missing };
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setBusinessName(profile.business_name || '');
      setCategory(profile.category || '');
    }
  }, [profile]);

  useEffect(() => {
    if (user && profile?.role === 'provider') {
      setServicesLoading(true);
      listProviderServices(user.id).then(data => {
        setServices(data);
        setServicesLoading(false);
      });
    }
  }, [user, profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: "Invalid file", description: "Only JPG, PNG, and WebP files are allowed.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5MB.", variant: "destructive" });
      return;
    }
    setAvatarLoading(true);
    const url = await uploadAvatar(file, user.id);
    if (url) {
      await updateProfile(user.id, { avatar_url: url } as any);
      await refreshProfile();
    }
    setAvatarLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const patch: any = { full_name: fullName, phone };
    if (profile?.role === 'provider') {
      patch.bio = bio;
      patch.business_name = businessName;
      patch.category = category;
    }
    await updateProfile(user.id, patch);
    await refreshProfile();
    setSaving(false);
  };

  const handleDeleteService = async () => {
    if (!deletingService) return;
    const ok = await deleteService(deletingService.id);
    if (ok) setServices(prev => prev.filter(s => s.id !== deletingService.id));
    setDeletingService(null);
  };

  const handleEditComplete = async () => {
    setEditingService(null);
    if (user) {
      const data = await listProviderServices(user.id);
      setServices(data);
    }
  };

  // Upsert fallback if profile is missing
  const [fetchError, setFetchError] = useState(false);
  const [upserting, setUpserting] = useState(false);

  useEffect(() => {
    const ensureProfile = async () => {
      if (user && !profile && !upserting) {
        setUpserting(true);
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            role: user.user_metadata?.role || 'customer',
          } as any);
          await refreshProfile();
        } catch {
          setFetchError(true);
        }
        setUpserting(false);
      }
    };
    ensureProfile();
  }, [user, profile, upserting, refreshProfile]);

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center max-w-sm">
          <p className="text-destructive font-medium mb-3">Failed to load profile</p>
          <Button variant="outline" onClick={() => { setFetchError(false); refreshProfile(); }}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Incomplete profile banner */}
        {completion.percent < 100 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-500">Incomplete profile</p>
                <p className="text-xs text-muted-foreground mt-1">Missing: {completion.missing.join(', ')}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={completion.percent} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground shrink-0">{completion.percent}%</span>
            </div>
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5"
              disabled={avatarLoading}
            >
              {avatarLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
            </button>
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile.full_name || 'Your Profile'}</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <Badge variant="secondary" className="mt-1 capitalize">{profile.role}</Badge>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-8">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="focus-visible:ring-primary" />
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="focus-visible:ring-primary" />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.city ? `${profile.city}${profile.area ? ', ' + profile.area : ''}` : 'Not set'}
              </span>
              <Button variant="outline" size="sm" onClick={() => setShowLocationModal(true)}>
                📍 Update Location
              </Button>
            </div>
          </div>

          {profile.role === 'provider' && (
            <>
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="focus-visible:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label>Bio <span className="text-xs text-muted-foreground">{bio.length}/200</span></Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} className="min-h-[80px] focus-visible:ring-primary" />
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>

        {/* Provider Services */}
        {profile.role === 'provider' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">My Services</h2>
              <Button size="sm" onClick={() => navigate('/services/new')}>
                <Plus className="w-4 h-4 mr-1" /> Add New Service
              </Button>
            </div>

            {servicesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="aspect-[4/5] bg-card rounded-xl animate-pulse" />)}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground mb-4">You haven't added any services yet</p>
                <Button onClick={() => navigate('/services/new')}>Add Your First Service</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    onEdit={setEditingService}
                    onDelete={(id) => setDeletingService(services.find(sv => sv.id === id) || null)}
                    showActions
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Customer section */}
        {profile.role === 'customer' && (
          <div>
            <h2 className="text-xl font-bold mb-4">My Activity</h2>
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground mb-4">Browse services and save your favorites</p>
              <Button variant="outline" onClick={() => navigate('/browse')}>Browse Services →</Button>
            </div>
          </div>
        )}
      </div>

      <LocationModal open={showLocationModal} onOpenChange={setShowLocationModal} />
      <EditServiceModal
        open={!!editingService}
        onOpenChange={(open) => !open && setEditingService(null)}
        service={editingService}
        onServiceUpdated={handleEditComplete}
      />

      <AlertDialog open={!!deletingService} onOpenChange={(open) => !open && setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingService?.title}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteService} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfilePage;
