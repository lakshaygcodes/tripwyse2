import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Palmtree } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });

    setLoading(false);

    if (signUpError) {
      toast({ title: 'Signup failed', description: signUpError.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Account created! 🎉', description: 'Check your email and click the verification link to sign in.' });
    setStep('confirm');
  };

  return (
    <div className="min-h-screen grain-overlay flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Palmtree className="w-8 h-8 text-primary" />
            <span className="font-serif text-2xl font-bold">Tripwise</span>
          </div>
          <p className="text-muted-foreground">
            {step === 'confirm' ? 'Check your email' : 'Sign in to manage your trips'}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card shadow-sm">
          {step === 'form' && (
            <>
              <div className="flex gap-1 p-1 rounded-full bg-secondary mb-6">
                {(['login', 'signup'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                      mode === m ? 'bg-background shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    {m === 'login' ? 'Login' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="bg-background" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="bg-background" required />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full rounded-full">
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        toast({ title: 'Enter your email', description: 'Type your email above, then click Forgot Password.', variant: 'destructive' });
                        return;
                      }
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) {
                        toast({ title: 'Error', description: error.message, variant: 'destructive' });
                      } else {
                        toast({ title: 'Reset link sent! 📧', description: 'Check your email for a password reset link.' });
                      }
                    }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                </form>
              )}

              {mode === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="bg-background" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="bg-background" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="bg-background" required minLength={6} />
                  </div>
                  <Button type="submit" disabled={loading || !fullName.trim()} className="w-full rounded-full">
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              )}
            </>
          )}

          {step === 'confirm' && (
            <div className="space-y-4 text-center">
              <div className="text-4xl">📧</div>
              <p className="text-sm text-muted-foreground">
                We sent a verification link to <strong>{email}</strong>. Click the link in the email to activate your account, then come back and log in.
              </p>
              <Button variant="outline" className="w-full rounded-full" onClick={() => { setStep('form'); setMode('login'); }}>
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
