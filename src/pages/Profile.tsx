import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile, uploadAvatar } from '@/lib/profiles';
import { listProviderServices, deleteService, Service } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import LocationModal from '@/components/LocationModal';
import ServiceCard from '@/components/ServiceCard';
import { EditServiceModal } from '@/components/EditServiceModal';
import { User, MapPin, Camera, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

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

  // Provider services
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

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
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB.", variant: "destructive" });
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

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Delete this service?')) return;
    const ok = await deleteService(id);
    if (ok) setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleEditComplete = async () => {
    setEditingService(null);
    if (user) {
      const data = await listProviderServices(user.id);
      setServices(data);
    }
  };

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
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
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
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
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
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bio <span className="text-xs text-muted-foreground">{bio.length}/200</span></Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} className="min-h-[80px]" />
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
                    onDelete={handleDeleteService}
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
              <p className="text-muted-foreground mb-4">No saved services yet</p>
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
    </div>
  );
};

export default ProfilePage;
