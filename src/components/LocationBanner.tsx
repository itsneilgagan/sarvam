import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LocationModal from './LocationModal';

const LocationBanner = () => {
  const { user, profile } = useAuth();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('loc_dismissed') === '1');
  const [showModal, setShowModal] = useState(false);

  if (!user || profile?.role !== 'customer' || profile?.city || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem('loc_dismissed', '1');
    setDismissed(true);
  };

  return (
    <>
      <div className="bg-secondary border-b border-border px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <span className="text-muted-foreground">Set your location to discover services near you</span>
        <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
          Set Location
        </Button>
        <button onClick={dismiss} className="ml-1 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <LocationModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
};

export default LocationBanner;
