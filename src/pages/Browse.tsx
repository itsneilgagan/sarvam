import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import ServiceGrid from '@/components/ServiceGrid';

const CATEGORIES = ['All', 'Cleaning', 'Plumbing', 'Beauty', 'Repairs', 'Tutoring', 'Outdoor', 'Tech', 'Events'];
const SORT_OPTIONS = ['Relevance', 'Price: Low to High', 'Price: High to Low', 'Newest'];

const Browse = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const params = new URLSearchParams(searchParams);
    if (cat !== 'All') params.set('category', cat); else params.delete('category');
    setSearchParams(params, { replace: true });
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
              className="w-full h-12 pl-12 pr-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
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

      {/* Price filter */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground shrink-0">₹{priceRange[0]} — ₹{priceRange[1]}</span>
          <Slider
            min={0}
            max={5000}
            step={100}
            value={priceRange}
            onValueChange={setPriceRange}
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <ServiceGrid
          searchQuery={debouncedQuery}
          category={category}
          minPrice={priceRange[0] > 0 ? priceRange[0] : undefined}
          maxPrice={priceRange[1] < 5000 ? priceRange[1] : undefined}
          refreshTrigger={refreshTrigger}
          showActions={!!user}
          currentUserId={user?.id}
        />
      </div>
    </div>
  );
};

export default Browse;
