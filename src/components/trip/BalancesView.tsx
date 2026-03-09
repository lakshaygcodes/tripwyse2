import { motion } from 'framer-motion';

interface Props {
  balances: Record<string, number>;
  currencySymbol: string;
  travellers: string[];
}

const BalancesView = ({ balances, currencySymbol, travellers }: Props) => {
  if (travellers.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-muted-foreground">Add expenses to see balances.</p>
      </div>
    );
  }

  const maxAbs = Math.max(...Object.values(balances).map(Math.abs), 1);

  return (
    <div className="space-y-4">
      {travellers.map((name, i) => {
        const balance = balances[name] || 0;
        const isPositive = balance > 0.01;
        const isNegative = balance < -0.01;
        const width = Math.max((Math.abs(balance) / maxAbs) * 100, 4);

        return (
          <motion.div
            key={name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl bg-card shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{name}</span>
              <span className={`font-semibold ${isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'}`}>
                {isPositive ? '+' : ''}{currencySymbol}{balance.toFixed(2)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                className={`h-full rounded-full ${isPositive ? 'bg-success' : isNegative ? 'bg-destructive' : 'bg-muted-foreground'}`}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isPositive ? 'Gets back' : isNegative ? 'Owes' : 'Settled'} {currencySymbol}{Math.abs(balance).toFixed(2)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default BalancesView;
