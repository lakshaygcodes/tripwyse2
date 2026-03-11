import { Settlement } from '@/types/trip';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, TrendingDown, TrendingUp, Coins } from 'lucide-react';

interface Props {
  pastSettlements: Settlement[];
  currencySymbol: string;
}

const SettledHistoryView = ({ pastSettlements, currencySymbol }: Props) => {
  if (pastSettlements.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-muted-foreground">No settled payments yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Use "Settle for now" to record payments.</p>
      </div>
    );
  }

  const totalSettled = pastSettlements.reduce((sum, s) => sum + s.amount, 0);

  // Who paid the most in settlements
  const paidAmounts: Record<string, number> = {};
  const receivedAmounts: Record<string, number> = {};
  pastSettlements.forEach(s => {
    paidAmounts[s.from] = (paidAmounts[s.from] || 0) + s.amount;
    receivedAmounts[s.to] = (receivedAmounts[s.to] || 0) + s.amount;
  });

  const topPayer = Object.entries(paidAmounts).sort((a, b) => b[1] - a[1])[0];
  const topReceiver = Object.entries(receivedAmounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <Coins className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total settled</p>
          </div>
          <p className="text-xl font-bold">{currencySymbol}{totalSettled.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Settlements</p>
          </div>
          <p className="text-xl font-bold">{pastSettlements.length}</p>
        </div>
        {topPayer && (
          <div className="p-4 rounded-xl bg-card shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-destructive" />
              <p className="text-xs text-muted-foreground">Top payer</p>
            </div>
            <p className="font-semibold truncate">{topPayer[0]}</p>
            <p className="text-sm text-muted-foreground">{currencySymbol}{topPayer[1].toFixed(2)}</p>
          </div>
        )}
        {topReceiver && (
          <div className="p-4 rounded-xl bg-card shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs text-muted-foreground">Top receiver</p>
            </div>
            <p className="font-semibold truncate">{topReceiver[0]}</p>
            <p className="text-sm text-muted-foreground">{currencySymbol}{topReceiver[1].toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Settlement log */}
      <div>
        <h3 className="font-serif font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
          Settlement Log
        </h3>
        <div className="space-y-3">
          {pastSettlements.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card shadow-sm"
            >
              <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center font-semibold text-sm text-destructive">
                {s.from[0]}
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">paid</p>
                <p className="text-lg font-bold text-primary">{currencySymbol}{s.amount.toFixed(2)}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary">
                {s.to[0]}
              </div>
              <div className="text-right text-sm min-w-[4rem]">
                <p className="font-medium truncate">{s.to}</p>
                <p className="text-xs text-muted-foreground truncate">from {s.from}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettledHistoryView;
