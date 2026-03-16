import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { mapSupabaseError } from '@/lib/errors';
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
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordChecks = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  }), [password]);

  const allChecksPassed = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword;
  const strength = Object.values(passwordChecks).filter(Boolean).length;
  const strengthLevel = strength <= 1 ? 1 : strength <= 2 ? 2 : strength <= 4 ? 3 : 4;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strengthLevel];
  const strengthColors = ['', 'bg-destructive', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  const canSubmit = fullName && email && phone && dob && !dobError && allChecksPassed && passwordsMatch && confirmPassword && agreedTerms && !loading;

  const validateDob = () => {
    if (!dob) return;
    const age = (new Date().getTime() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    setDobError(age < 18 ? 'You must be 18 or older to use Sarvam' : '');
  };

  const validatePhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 12;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (!validatePhone(phone)) {
      toast({ title: "Invalid phone", description: "Please enter a valid Indian phone number.", variant: "destructive" });
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
        ? 'An account with this email already exists.'
        : error.message?.includes('Password')
        ? 'Password must be at least 8 characters.'
        : 'Could not create your account. Please try again.';
      toast({ title: "Signup failed", description: msg, variant: "destructive" });
    } else {
      navigate('/onboarding');
    }
  };

  const CheckItem = ({ ok, text }: { ok: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-green-500' : 'text-muted-foreground'}`}>
      {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} {text}
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
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rahul Sharma" required className="focus-visible:ring-primary" />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rahul@example.com" required className="focus-visible:ring-primary" />
            </div>

            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required className="focus-visible:ring-primary" />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} onBlur={validateDob} required className="focus-visible:ring-primary" />
              {dobError && <p className="text-xs text-destructive">{dobError}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-10 focus-visible:ring-primary"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password && (
                <div className="space-y-3 pt-1">
                  {/* Strength meter */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strengthLevel ? strengthColors[strengthLevel] : 'bg-secondary'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthColors[strengthLevel].replace('bg-', 'text-')}`}>{strengthLabel}</p>

                  {/* Checklist */}
                  <div className="grid grid-cols-1 gap-1.5">
                    <CheckItem ok={passwordChecks.length} text="At least 8 characters" />
                    <CheckItem ok={passwordChecks.upper} text="One uppercase letter (A-Z)" />
                    <CheckItem ok={passwordChecks.lower} text="One lowercase letter (a-z)" />
                    <CheckItem ok={passwordChecks.number} text="One number (0-9)" />
                    <CheckItem ok={passwordChecks.special} text="One special character (!@#$%^&*)" />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label>Confirm Password *</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  placeholder="••••••••"
                  required
                  className="pr-10 focus-visible:ring-primary"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmTouched && confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
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

            <Button type="submit" className="w-full" disabled={!canSubmit}>
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
