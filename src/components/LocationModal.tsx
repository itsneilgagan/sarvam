import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { updateProfile } from '@/lib/profiles';
import { useAuth } from '@/hooks/useAuth';

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LocationModal = ({ open, onOpenChange }: LocationModalProps) => {
  const { user, refreshProfile } = useAuth();
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || '';
          const detectedArea = data.address?.suburb || data.address?.neighbourhood || '';
          setCity(detectedCity);
          setArea(detectedArea);

          if (user) {
            await updateProfile(user.id, {
              city: detectedCity,
              area: detectedArea,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            } as any);
            await refreshProfile();
          }
        } catch {
          // silently fail
        }
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!user || !city) return;
    setLoading(true);
    await updateProfile(user.id, { city, area } as any);
    await refreshProfile();
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Set Your Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGPS}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Detecting...</>
            ) : (
              <><Navigation className="w-4 h-4 mr-2" /> Use My GPS</>
            )}
          </Button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-border" />
            <span className="px-3 text-xs text-muted-foreground">or enter manually</span>
            <div className="flex-grow border-t border-border" />
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Mumbai" />
          </div>
          <div className="space-y-2">
            <Label>Area</Label>
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g., Andheri West" />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={loading || !city}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;
