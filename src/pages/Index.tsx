import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MapPin, Receipt, Users, ArrowRight, LogOut, Plus, UserPlus, Palmtree } from 'lucide-react';
import DarkModeToggle from '@/components/trip/DarkModeToggle';
import { useAuth } from '@/hooks/useAuth';
import { getUserTrips } from '@/lib/supabaseTripStore';

const features = [
  {
    icon: <Receipt className="w-6 h-6" />,
    title: 'Add expenses anywhere',
    description: 'Log costs on the go — food, transport, stays, and more.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'See who owes what',
    description: 'Real-time balances so everyone knows where they stand.',
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Settle in one tap',
    description: 'Minimised transactions. Clean, simple settlements.',
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserTrips().then(t => {
      setTrips(t);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen grain-overlay">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <Palmtree className="w-6 h-6 text-primary" />
          <span className="font-serif font-bold text-lg">Tripwise</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
          <DarkModeToggle />
        </div>
      </div>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-secondary">
            <span className="text-sm font-medium text-muted-foreground">🌴 Travel-first expense splitting</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-serif font-bold tracking-tight leading-tight mb-6">
            Split the trip,
            <br />
            <span className="text-primary">not the friendship.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed">
            Track group expenses on the go. Settle up when you're home.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/create')}
              className="text-lg px-8 py-6 rounded-full gap-2 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus className="w-5 h-5" /> Start a Trip
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/join')}
              className="text-lg px-8 py-6 rounded-full gap-2"
            >
              <UserPlus className="w-5 h-5" /> Join a Trip
            </Button>
          </div>
        </motion.div>
      </div>

      {/* My Trips */}
      {!loading && trips.length > 0 && (
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-12">
          <h2 className="font-serif text-2xl font-bold mb-4">Your Trips</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {trips.map((trip) => (
              <motion.button
                key={trip.id}
                onClick={() => navigate(`/trip/${trip.id}`)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-card shadow-sm text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-serif font-semibold">{trip.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {trip.start_date && trip.end_date ? `${trip.start_date} → ${trip.end_date}` : 'No dates set'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Code: <span className="font-mono font-bold">{trip.join_code}</span></p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
              className="p-6 rounded-2xl bg-card shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <footer className="relative z-10 text-center pb-8 text-sm text-muted-foreground">
        Made with ❤️ for travellers everywhere
      </footer>
    </div>
  );
};

export default Index;
