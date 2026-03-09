import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Palmtree, Lock } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check if this is a recovery flow from the URL hash
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please make sure both passwords are identical.', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated! 🔒', description: 'You can now sign in with your new password.' });
      navigate('/auth');
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen grain-overlay flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Palmtree className="w-8 h-8 text-primary" />
            <span className="font-serif text-2xl font-bold">Tripwise</span>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow-sm">
            <p className="text-muted-foreground mb-4">This page is used to reset your password. Please use the link from your email.</p>
            <Button variant="outline" className="w-full rounded-full" onClick={() => navigate('/auth')}>
              Back to Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grain-overlay flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Palmtree className="w-8 h-8 text-primary" />
            <span className="font-serif text-2xl font-bold">Tripwise</span>
          </div>
          <p className="text-muted-foreground">Set your new password</p>
        </div>

        <div className="p-6 rounded-2xl bg-card shadow-sm">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="bg-background" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" className="bg-background" required minLength={6} />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full">
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
