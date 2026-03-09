import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinTripByCode } from '@/lib/supabaseTripStore';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Users } from 'lucide-react';

const JoinTrip = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !displayName.trim()) return;
    setLoading(true);
    try {
      const trip = await joinTripByCode(code.trim(), displayName.trim());
      toast({ title: 'Joined!', description: `Welcome to ${trip.name}` });
      navigate(`/trip/${trip.id}`);
    } catch (err: any) {
      toast({ title: 'Failed to join', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grain-overlay">
      <div className="relative z-10 max-w-lg mx-auto px-6 py-12">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-serif font-bold">Join a Trip</h1>
          </div>
          <p className="text-muted-foreground mb-8">Enter the 5-digit code shared by your travel buddy</p>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <Label>Trip Code</Label>
              <Input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. 48291"
                maxLength={5}
                className="bg-card text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="What should others call you?"
                className="bg-card"
              />
            </div>

            <Button type="submit" disabled={loading || !code.trim() || !displayName.trim()} className="w-full rounded-full text-lg py-6">
              {loading ? 'Joining...' : 'Join Trip 🤝'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinTrip;
