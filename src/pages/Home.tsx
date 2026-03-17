import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { listServices, Service } from '@/lib/services';
import ServiceCard from '@/components/ServiceCard';

const CATEGORIES = ['All', 'Cleaning', 'Plumbing', 'Beauty', 'Repairs', 'Tutoring', 'Outdoor', 'Tech', 'Events'];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [trending, setTrending] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listServices({ limit: 6 }).then(data => {
      setTrending(data);
      setLoading(false);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-24 pb-16 md:pt-32 md:pb-24">
        <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm rounded-full bg-secondary text-muted-foreground">
          🇮🇳 India's Service Marketplace
        </Badge>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center max-w-3xl leading-tight tracking-tight mb-4">
          Find trusted services near you
        </h1>

        <p className="text-lg text-muted-foreground text-center max-w-xl mb-10">
          Connect with verified local professionals in seconds
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="w-full max-w-xl mb-8">
          <div className="relative flex items-center bg-card border border-border rounded-full shadow-lg shadow-primary/5 overflow-hidden">
            <Search className="absolute left-5 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for plumbers, tutors, cleaners..."
              className="w-full h-14 pl-14 pr-32 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
            />
            <Button type="submit" className="absolute right-2 h-10 px-6">
              Search
            </Button>
          </div>
        </form>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-xl w-full pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => navigate(`/browse${cat !== 'All' ? `?category=${cat}` : ''}`)}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Trending Near You</h2>
          <Link to="/browse" className="text-sm text-primary hover:underline">
            View All Services →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : trending.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trending.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl">🔍</div>
            <h3 className="text-lg font-semibold text-foreground">No services yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Be the first to list a service on Sarvam!
            </p>
            {user && (
              <Button asChild className="mt-2">
                <Link to="/services/new">Add Your First Service</Link>
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-bold text-primary">sarvam</span>
          <span>© 2025 Sarvam. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
