import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getService, deleteService, Service } from '@/lib/services';
import { getProfile } from '@/lib/profiles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, User, MapPin, Calendar, Pencil, Trash2 } from 'lucide-react';
import type { Profile } from '@/hooks/useAuth';

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getService(id).then(async (s) => {
      setService(s);
      if (s?.provider_id) {
        const p = await getProfile(s.provider_id);
        setProvider(p);
      }
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!service || !window.confirm('Delete this service?')) return;
    const ok = await deleteService(service.id);
    if (ok) navigate('/profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Service not found</p>
        <Button variant="ghost" onClick={() => navigate('/browse')}>← Back to Browse</Button>
      </div>
    );
  }

  const isOwner = user?.id === service.provider_id;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {service.cover_image_url && (
              <img src={service.cover_image_url} alt={service.title} className="w-full aspect-video object-cover rounded-xl" />
            )}

            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {service.category && (
                  <Badge className="bg-primary text-primary-foreground rounded-full">{service.category}</Badge>
                )}
                {service.tags?.map((tag, i) => (
                  <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>
                ))}
              </div>

              <h1 className="text-3xl font-bold mb-4">{service.title}</h1>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{service.description}</p>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="text-2xl font-bold text-primary">
                {service.price ? `₹${Math.round(service.price)}` : 'Price on request'}
              </span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(service.created_at)}</span>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Provider card */}
            <div className="bg-card border border-border rounded-xl p-5 sticky top-20">
              <div className="flex items-center gap-3 mb-4">
                {provider?.avatar_url ? (
                  <img src={provider.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{provider?.business_name || provider?.full_name || 'Service Provider'}</p>
                  {provider?.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {provider.city}{provider.area ? `, ${provider.area}` : ''}
                    </p>
                  )}
                </div>
              </div>
              {provider?.bio && <p className="text-sm text-muted-foreground mb-4">{provider.bio}</p>}

              {isOwner ? (
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => navigate(`/services/${service.id}/edit`)}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit Service
                  </Button>
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Service
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={() => toast({ title: "Coming soon", description: "Contact feature is coming soon!" })}>
                  Contact Provider
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
