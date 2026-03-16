import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut, Plus, Search } from 'lucide-react';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">
            sarvam
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {profile?.role === 'provider' ? (
                  <Button size="sm" onClick={() => navigate('/services/new')}>
                    <Plus className="w-4 h-4 mr-1" /> Add Service
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/browse')}>
                    <Search className="w-4 h-4 mr-1" /> Browse Services
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-secondary transition-colors">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {profile?.full_name || profile?.first_name || 'Account'}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" /> Profile
                    </DropdownMenuItem>
                    {profile?.role === 'provider' && (
                      <DropdownMenuItem onClick={() => navigate('/services/new')}>
                        <Plus className="w-4 h-4 mr-2" /> Add Service
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {user ? (
              <>
                <button
                  onClick={() => { navigate('/profile'); setMobileOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-secondary text-sm"
                >
                  <User className="w-4 h-4" /> Profile
                </button>
                {profile?.role === 'provider' && (
                  <button
                    onClick={() => { navigate('/services/new'); setMobileOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-secondary text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Service
                  </button>
                )}
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-secondary text-sm text-destructive"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                  Login
                </Button>
                <Button className="w-full" onClick={() => { navigate('/signup'); setMobileOpen(false); }}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
