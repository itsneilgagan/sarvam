import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Home, Search, User, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const BottomNav = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const handleAddClick = () => {
    if (profile?.role === 'provider') {
      navigate('/services/new');
    } else {
      toast({ title: "Providers only", description: "Only providers can add services. Update your role in profile." });
    }
  };

  const items = [
    { icon: Home, label: 'Home', path: '/', onClick: () => navigate('/') },
    { icon: Search, label: 'Browse', path: '/browse', onClick: () => navigate('/browse') },
    { icon: Plus, label: 'Add', path: '/services/new', onClick: handleAddClick },
    { icon: User, label: 'Profile', path: '/profile', onClick: () => navigate('/profile') },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const active = location.pathname === item.path;
          const isAddBtn = item.label === 'Add';
          const isDisabled = isAddBtn && profile?.role !== 'provider';
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors ${
                active ? 'text-primary' : isDisabled ? 'text-muted-foreground/40' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
