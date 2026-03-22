import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Search, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import ServiceGrid from '@/components/ServiceGrid';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['All', 'Cleaning', 'Plumbing', 'Beauty', 'Repairs', 'Tutoring', 'Outdoor', 'Tech', 'Events'];

const Browse = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialMaxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : 5000;
  const initialMinPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : 0;

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState([initialMinPrice, initialMaxPrice]);
  const [resultCount, setResultCount] = useState<number | null>(null);

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      toast({
        title: 'Service is live ✅',
        description: 'Your newly created service now appears in search results.',
      });
    }
  }, [searchParams]);

  const hasActiveFilters = debouncedQuery || category !== 'All' || priceRange[0] > 0 || priceRange[1] < 5000;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (category !== 'All') params.set('category', category);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 5000) params.set('maxPrice', priceRange[1].toString());
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, category, priceRange, setSearchParams]);

  const handleCategoryChange = (cat: string) => setCategory(cat);

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedQuery('');
    setCategory('All');
    setPriceRange([0, 5000]);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Search bar */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative flex items-center bg-card border border-border rounded-full overflow-hidden mb-4">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for plumbers, tutors, cleaners..."
              className="w-full h-12 pl-12 pr-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
            />
          </div>

          {/* Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price filter + result info */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-muted-foreground shrink-0">₹{priceRange[0]} — ₹{priceRange[1]}</span>
          <Slider
            min={0}
            max={5000}
            step={100}
            value={priceRange}
            onValueChange={setPriceRange}
            className="max-w-xs"
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
              <XIcon className="w-3 h-3 mr-1" /> Clear filters
            </Button>
          )}
        </div>
        {debouncedQuery && resultCount !== null && (
          <p className="text-sm text-muted-foreground mt-3">
            Showing {resultCount} result{resultCount !== 1 ? 's' : ''} for "{debouncedQuery}"
          </p>
        )}
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <ServiceGrid
          searchQuery={debouncedQuery}
          category={category}
          minPrice={priceRange[0] > 0 ? priceRange[0] : undefined}
          maxPrice={priceRange[1] < 5000 ? priceRange[1] : undefined}
          showActions={!!user}
          currentUserId={user?.id}
          onResultCount={setResultCount}
        />
      </div>
    </div>
  );
};

export default Browse;
