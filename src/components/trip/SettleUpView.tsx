import { Settlement } from '@/types/trip';
import { motion } from 'framer-motion';
import { ArrowRight, PartyPopper } from 'lucide-react';

interface Props {
  settlements: Settlement[];
  currencySymbol: string;
  hasExpenses: boolean;
}

const SettleUpView = ({ settlements, currencySymbol, hasExpenses }: Props) => {
  if (!hasExpenses) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🤝</p>
        <p className="text-muted-foreground">Add expenses to see settlements.</p>
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-16"
      >
        <PartyPopper className="w-16 h-16 mx-auto text-primary mb-4" />
        <h3 className="font-serif text-2xl font-bold mb-2">All settled! 🎉</h3>
        <p className="text-muted-foreground">Everyone is even. Trip complete!</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-2">
        {settlements.length} transaction{settlements.length > 1 ? 's' : ''} to settle up
      </p>
      {settlements.map((s, i) => (
        <motion.div
          key={`${s.from}-${s.to}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-4 p-5 rounded-2xl bg-card shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm">
            {s.from[0]}
          </div>
          <div className="flex-1 text-center">
            <p className="text-sm text-muted-foreground mb-1">pays</p>
            <p className="text-xl font-bold text-primary">{currencySymbol}{s.amount.toFixed(2)}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-semibold text-sm text-primary-foreground">
            {s.to[0]}
          </div>
        </motion.div>
      ))}
      <div className="mt-6 p-4 rounded-xl bg-secondary text-center">
        <p className="text-sm text-muted-foreground">
          {settlements.map(s => `${s.from} pays ${s.to} ${currencySymbol}${s.amount.toFixed(2)}`).join(' · ')}
        </p>
      </div>
    </div>
  );
};

export default SettleUpView;
