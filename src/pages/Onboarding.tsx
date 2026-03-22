import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const CATEGORIES = [
  { name: 'Cleaning', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400' },
  { name: 'Plumbing', img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400' },
  { name: 'Beauty', img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400' },
  { name: 'Tutoring', img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400' },
  { name: 'Repairs', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400' },
  { name: 'Gardening', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400' },
];

const Onboarding = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('onboarding_seen') === '1') {
      navigate(profile?.role === 'provider' ? '/services/new?welcome=1' : '/browse', { replace: true });
    }
  }, [navigate, profile]);

  const finish = (path: string) => {
    localStorage.setItem('onboarding_seen', '1');
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <h1 className="text-xl font-bold text-primary mb-8">sarvam</h1>

      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-2">What's Trending on Sarvam</h2>
      <p className="text-muted-foreground text-center mb-10">Explore what people are hiring right now</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl w-full mb-12">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => finish(`/browse?category=${cat.name}`)}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden"
          >
            <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <span className="text-sm font-bold text-white">{cat.name}</span>
              <span className="text-white/60 group-hover:text-white transition-colors">→</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        {profile?.role === 'provider' ? (
          <Button size="lg" onClick={() => finish('/services/new?welcome=1')}>
            Add Your First Service →
          </Button>
        ) : (
          <Button size="lg" onClick={() => finish('/browse')}>
            Browse Services Near Me →
          </Button>
        )}
        <button onClick={() => finish('/')} className="text-sm text-muted-foreground hover:text-foreground">
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
