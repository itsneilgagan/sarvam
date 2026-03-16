import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';

const Signup = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dobError, setDobError] = useState('');

  const passwordChecks = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  }), [password]);

  const strength = Object.values(passwordChecks).filter(Boolean).length;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-destructive', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][strength];

  const validateDob = () => {
    if (!dob) return;
    const age = (new Date().getTime() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 18) {
      setDobError('You must be 18 or older to use Sarvam');
    } else {
      setDobError('');
    }
  };

  const validatePhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 12;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !dob || !password || !confirmPassword) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (dobError) return;
    if (!validatePhone(phone)) {
      toast({ title: "Invalid phone", description: "Please enter a valid Indian phone number.", variant: "destructive" });
      return;
    }
    if (strength < 3) {
      toast({ title: "Weak password", description: "Please choose a stronger password.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Password mismatch", description: "Passwords don't match.", variant: "destructive" });
      return;
    }
    if (!agreedTerms) {
      toast({ title: "Terms required", description: "Please agree to the Terms & Conditions.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const nameParts = fullName.trim().split(' ');
    const { error } = await signUp(email, password, {
      full_name: fullName,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      phone,
      dob,
      role,
    });
    setLoading(false);

    if (error) {
      const msg = error.message?.includes('already registered')
        ? 'This email is already registered. Please sign in.'
        : 'Could not create your account. Please try again.';
      toast({ title: "Signup failed", description: msg, variant: "destructive" });
    } else {
      navigate('/onboarding');
    }
  };

  const CheckItem = ({ ok, text }: { ok: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${ok ? 'text-green-500' : 'text-muted-foreground'}`}>
      {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {text}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="text-2xl font-bold text-primary">sarvam</Link>
          <h1 className="text-2xl font-bold mt-4 mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm">Join India's service marketplace</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rahul Sharma" required />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rahul@example.com" required />
            </div>

            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} onBlur={validateDob} required />
              {dobError && <p className="text-xs text-destructive">{dobError}</p>}
            </div>

            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor : 'bg-secondary'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strengthLabel}</p>
                  <div className="grid grid-cols-2 gap-1">
                    <CheckItem ok={passwordChecks.length} text="8+ characters" />
                    <CheckItem ok={passwordChecks.upper} text="Uppercase letter" />
                    <CheckItem ok={passwordChecks.number} text="Number" />
                    <CheckItem ok={passwordChecks.special} text="Special char" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirm Password *</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords don't match</p>
              )}
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <Label>I want to...</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'customer' as const, emoji: '🧑', label: 'Hire Services', desc: 'Find professionals' },
                  { value: 'provider' as const, emoji: '🛠️', label: 'Offer Services', desc: 'Grow my business' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      role === opt.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="text-2xl mb-1">{opt.emoji}</div>
                    <div className="text-sm font-semibold">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreedTerms}
                onCheckedChange={(c) => setAgreedTerms(c === true)}
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="text-primary hover:underline">
                  Terms & Conditions
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Login →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
