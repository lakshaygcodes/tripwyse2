import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTripFromDB, deleteExpenseFromDB, addSettlementToDB, getBalancesWithSettlements, getSettlementsFromBalances } from '@/lib/supabaseTripStore';
import { CATEGORY_CONFIG, ExpenseCategory, Expense } from '@/types/trip';
import { MapPin, Plus, Trash2, Copy, HandCoins, Share2, Pencil, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BalancesView from '@/components/trip/BalancesView';
import SettleUpView from '@/components/trip/SettleUpView';
import AddExpenseDialog from '@/components/trip/AddExpenseDialog';
import EditExpenseDialog from '@/components/trip/EditExpenseDialog';
import ShareJoinCode from '@/components/trip/ShareJoinCode';
import ExpenseFilters from '@/components/trip/ExpenseFilters';
import TripStats from '@/components/trip/TripStats';
import SettledHistoryView from '@/components/trip/SettledHistoryView';
import DarkModeToggle from '@/components/trip/DarkModeToggle';
import { toast } from '@/hooks/use-toast';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', AUD: 'A$', CAD: 'C$', THB: '฿', IDR: 'Rp',
};

interface TripData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  joinCode: string;
  travellers: string[];
  expenses: Expense[];
  pastSettlements: any[];
  createdAt: string;
}

const TripDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  const reload = async () => {
    if (id) {
      const data = await getTripFromDB(id);
      setTrip(data);
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [id]);

  const filteredExpenses = useMemo(() => {
    if (!trip) return [];
    let exps = [...trip.expenses];
    if (filterCategory !== 'all') {
      exps = exps.filter(e => e.category === filterCategory);
    }
    if (sortBy === 'amount') {
      exps.sort((a, b) => b.amount - a.amount);
    } else {
      exps.sort((a, b) => b.date.localeCompare(a.date));
    }
    return exps;
  }, [trip, filterCategory, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading trip...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold mb-2">Trip not found</h2>
          <p className="text-muted-foreground mb-4">This trip doesn't exist or has been removed.</p>
          <Button variant="secondary" onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const balances = getBalancesWithSettlements(trip.expenses, trip.pastSettlements, trip.travellers);
  const settlements = getSettlementsFromBalances(balances);
  const total = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const sym = CURRENCY_SYMBOLS[trip.currency] || trip.currency;

  const handleDelete = async (expenseId: string) => {
    await deleteExpenseFromDB(expenseId);
    reload();
  };

  const handleSettleNow = async () => {
    if (settlements.length === 0) {
      toast({ title: 'All settled!', description: 'No outstanding balances.' });
      return;
    }
    try {
      for (const s of settlements) {
        await addSettlementToDB(trip.id, s);
      }
      toast({ title: 'Settled! 🎉', description: 'All current balances have been recorded as settled.' });
      reload();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen grain-overlay pb-24">
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate('/')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← All Trips
            </button>
            <DarkModeToggle />
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold">{trip.name}</h1>
              {trip.startDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  {trip.startDate} → {trip.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Join code + share */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowShare(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm font-medium hover:bg-accent transition-colors"
            >
              <span>Code: <span className="font-mono font-bold">{trip.joinCode}</span></span>
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-6 p-5 rounded-2xl bg-card shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Total trip spend</p>
            <p className="text-3xl font-bold">{sym}{total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{trip.expenses.length} expenses · {trip.travellers.length} travellers</p>
          </div>

          {settlements.length > 0 && (
            <Button
              onClick={handleSettleNow}
              variant="secondary"
              className="mt-4 w-full rounded-full gap-2 py-5 text-accent-foreground bg-accent hover:bg-accent/80"
            >
              <HandCoins className="w-5 h-5" /> Settle for now
            </Button>
          )}
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="w-full bg-secondary rounded-full p-1 mb-6">
            <TabsTrigger value="expenses" className="flex-1 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Expenses</TabsTrigger>
            <TabsTrigger value="balances" className="flex-1 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Balances</TabsTrigger>
            <TabsTrigger value="settle" className="flex-1 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Settle</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">History</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BarChart3 className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            <ExpenseFilters
              selectedCategory={filterCategory}
              onCategoryChange={setFilterCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
            <AnimatePresence>
              {filteredExpenses.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <p className="text-4xl mb-3">🧳</p>
                  <p className="text-muted-foreground">
                    {filterCategory !== 'all' ? 'No expenses in this category.' : 'No expenses yet. Start adding!'}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.map((exp) => (
                    <motion.div
                      key={exp.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-card shadow-sm group cursor-pointer"
                      onClick={() => setEditingExpense(exp)}
                    >
                      <span className="text-2xl">{CATEGORY_CONFIG[exp.category]?.icon || '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{exp.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Paid by {exp.paidBy} · Split {exp.splitBetween.length} ways
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">{sym}{exp.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{exp.date}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingExpense(exp); }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(exp.id); }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="balances">
            <BalancesView balances={balances} currencySymbol={sym} travellers={trip.travellers} />
          </TabsContent>

          <TabsContent value="settle">
            <SettleUpView settlements={settlements} currencySymbol={sym} hasExpenses={trip.expenses.length > 0} />
          </TabsContent>

          <TabsContent value="stats">
            <TripStats expenses={trip.expenses} travellers={trip.travellers} currencySymbol={sym} />
          </TabsContent>

          <TabsContent value="history">
            <SettledHistoryView pastSettlements={trip.pastSettlements} currencySymbol={sym} />
          </TabsContent>
        </Tabs>
      </div>

      {/* FAB */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl"
          onClick={() => setShowAddExpense(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

      {trip && (
        <>
          <AddExpenseDialog
            open={showAddExpense}
            onClose={() => setShowAddExpense(false)}
            tripId={trip.id}
            travellers={trip.travellers}
            startDate={trip.startDate}
            endDate={trip.endDate}
            onAdded={reload}
          />
          {editingExpense && (
            <EditExpenseDialog
              open={!!editingExpense}
              onClose={() => setEditingExpense(null)}
              tripId={trip.id}
              travellers={trip.travellers}
              startDate={trip.startDate}
              endDate={trip.endDate}
              expense={editingExpense}
              onUpdated={reload}
            />
          )}
          <ShareJoinCode
            open={showShare}
            onClose={() => setShowShare(false)}
            joinCode={trip.joinCode}
            tripName={trip.name}
          />
        </>
      )}
    </div>
  );
};

export default TripDashboard;
