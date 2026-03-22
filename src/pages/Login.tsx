import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { mapSupabaseError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);

    if (error) {
      setLoading(false);
      toast({ title: "Login failed", description: mapSupabaseError(error), variant: "destructive" });
      return;
    }

    // Ensure profile and perform role-based redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      let role = profile?.role;

      if (!role) {
        const meta = user.user_metadata || {};
        const { data: upserted } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email || null,
            full_name: meta.full_name || '',
            first_name: meta.first_name || null,
            last_name: meta.last_name || null,
            phone: meta.phone || null,
            role: meta.role || 'customer',
            dob: meta.dob || null,
          } as any, { onConflict: 'id' })
          .select('role')
          .single();

        role = upserted?.role || meta.role || 'customer';
      }

      setLoading(false);

      if (role === 'provider') {
        const { count } = await supabase
          .from('services')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', user.id);

        if (!count || count === 0) {
          navigate('/services/new?welcome=1');
        } else {
          navigate('/profile');
        }
      } else if (role === 'customer') {
        navigate('/browse');
      } else {
        navigate('/onboarding');
      }
    } else {
      setLoading(false);
      navigate('/browse');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Enter email", description: "Please enter your email address first.", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    toast({ title: "Check your email", description: "Reset link sent to your email." });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-primary">sarvam</Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="focus-visible:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="text-xs text-primary hover:underline float-right"
              >
                {forgotLoading ? 'Sending...' : 'Forgot Password?'}
              </button>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          New to Sarvam?{' '}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Create account →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
