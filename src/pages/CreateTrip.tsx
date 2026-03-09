import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTripInDB } from '@/lib/supabaseTripStore';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';

const CURRENCIES = [
  { code: 'INR', symbol: '₹' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'THB', symbol: '฿' },
  { code: 'IDR', symbol: 'Rp' },
];

const CreateTrip = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [travellers, setTravellers] = useState<string[]>([]);
  const [newTraveller, setNewTraveller] = useState('');
  const [loading, setLoading] = useState(false);

  const addTraveller = () => {
    const trimmed = newTraveller.trim();
    if (trimmed && !travellers.includes(trimmed)) {
      setTravellers([...travellers, trimmed]);
      setNewTraveller('');
    }
  };

  const removeTraveller = (name: string) => {
    setTravellers(travellers.filter(t => t !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || travellers.length < 2) return;
    setLoading(true);
    try {
      const trip = await createTripInDB({ name, startDate, endDate, currency, travellers });
      toast({ title: 'Trip created!', description: `Share code: ${trip.join_code}` });
      navigate(`/trip/${trip.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const isValid = name.trim() && travellers.length >= 2;

  return (
    <div className="min-h-screen grain-overlay">
      <div className="relative z-10 max-w-lg mx-auto px-6 py-12">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-2">Create a Trip</h1>
          <p className="text-muted-foreground mb-8">Where are you heading? 🌴</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Trip Name</Label>
              <Input id="name" placeholder='e.g. "Goa 2026 🏖️"' value={name} onChange={e => setName(e.target.value)} className="bg-card" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Date</Label>
                <Input id="start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-card" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Date</Label>
                <Input id="end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-card" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Travellers ({travellers.length})</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a name"
                  value={newTraveller}
                  onChange={e => setNewTraveller(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTraveller(); } }}
                  className="bg-card"
                />
                <Button type="button" variant="secondary" size="icon" onClick={addTraveller}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {travellers.length < 2 && <p className="text-xs text-muted-foreground">Add at least 2 travellers</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {travellers.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-sm font-medium">
                    {t}
                    <button type="button" onClick={() => removeTraveller(t)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={!isValid || loading} className="w-full rounded-full text-lg py-6 mt-4">
              {loading ? 'Creating...' : "Let's Go ✈️"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateTrip;
