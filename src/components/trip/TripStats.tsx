import { Expense, CATEGORY_CONFIG, ExpenseCategory } from '@/types/trip';

interface Props {
  expenses: Expense[];
  travellers: string[];
  currencySymbol: string;
}

const TripStats = ({ expenses, travellers, currencySymbol }: Props) => {
  if (expenses.length === 0) return null;

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = total / travellers.length;

  // Per-person spending
  const spentBy: Record<string, number> = {};
  travellers.forEach(t => (spentBy[t] = 0));
  expenses.forEach(e => {
    spentBy[e.paidBy] = (spentBy[e.paidBy] || 0) + e.amount;
  });

  // Category breakdown
  const byCategory: Record<string, number> = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCatAmount = sortedCategories[0]?.[1] || 1;

  // Daily spending
  const byDate: Record<string, number> = {};
  expenses.forEach(e => {
    byDate[e.date] = (byDate[e.date] || 0) + e.amount;
  });
  const maxDaySpend = Math.max(...Object.values(byDate), 1);
  const sortedDates = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-card shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Avg per person</p>
          <p className="text-xl font-bold">{currencySymbol}{perPerson.toFixed(0)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Avg per expense</p>
          <p className="text-xl font-bold">{currencySymbol}{(total / expenses.length).toFixed(0)}</p>
        </div>
      </div>

      {/* Who spent how much */}
      <div className="p-4 rounded-xl bg-card shadow-sm">
        <h3 className="font-serif font-semibold mb-3">Who paid what</h3>
        <div className="space-y-2">
          {travellers.map(t => {
            const pct = total > 0 ? (spentBy[t] / total) * 100 : 0;
            return (
              <div key={t}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t}</span>
                  <span className="font-medium">{currencySymbol}{(spentBy[t] || 0).toFixed(0)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="p-4 rounded-xl bg-card shadow-sm">
        <h3 className="font-serif font-semibold mb-3">By category</h3>
        <div className="space-y-2">
          {sortedCategories.map(([cat, amt]) => {
            const config = CATEGORY_CONFIG[cat as ExpenseCategory];
            const pct = (amt / maxCatAmount) * 100;
            return (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{config?.icon} {config?.label || cat}</span>
                  <span className="font-medium">{currencySymbol}{amt.toFixed(0)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily spending */}
      {sortedDates.length > 1 && (
        <div className="p-4 rounded-xl bg-card shadow-sm">
          <h3 className="font-serif font-semibold mb-3">Daily spending</h3>
          <div className="flex items-end gap-1 h-24">
            {sortedDates.map(([date, amt]) => {
              const pct = (amt / maxDaySpend) * 100;
              const d = new Date(date);
              const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all min-h-[4px]"
                    style={{ height: `${pct}%` }}
                    title={`${currencySymbol}${amt.toFixed(0)}`}
                  />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripStats;
