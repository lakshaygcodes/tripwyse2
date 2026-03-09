import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ExpenseCategory, CATEGORY_CONFIG, Expense } from '@/types/trip';
import { updateExpenseInDB } from '@/lib/supabaseTripStore';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  tripId: string;
  travellers: string[];
  startDate: string;
  endDate: string;
  expense: Expense;
  onUpdated: () => void;
}

function getDateRange(start: string, end: string): string[] {
  if (!start || !end) return [];
  const dates: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

const EditExpenseDialog = ({ open, onClose, tripId, travellers, startDate, endDate, expense, onUpdated }: Props) => {
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [paidBy, setPaidBy] = useState(expense.paidBy);
  const [splitBetween, setSplitBetween] = useState<string[]>([...expense.splitBetween]);
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [date, setDate] = useState(expense.date);
  const [loading, setLoading] = useState(false);

  const dateRange = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate]);

  const toggleSplit = (name: string) => {
    setSplitBetween(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!description || !amountNum || splitBetween.length === 0) return;

    setLoading(true);
    try {
      await updateExpenseInDB(expense.id, {
        description,
        amount: amountNum,
        paidBy,
        splitBetween,
        category,
        date,
      });
      toast({ title: 'Expense updated!' });
      onUpdated();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Edit Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} className="bg-card" />
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="bg-card" />
          </div>

          <div className="space-y-2">
            <Label>Paid by</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {travellers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            {dateRange.length > 0 ? (
              <RadioGroup value={date} onValueChange={setDate} className="flex flex-wrap gap-2">
                {dateRange.map(d => (
                  <label
                    key={d}
                    className={`cursor-pointer px-3 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      date === d
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <RadioGroupItem value={d} className="sr-only" />
                    {formatDateLabel(d)}
                  </label>
                ))}
              </RadioGroup>
            ) : (
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-card" />
            )}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, { icon: string; label: string }][]).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-colors ${
                    category === key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {val.icon} {val.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Split between</Label>
            <div className="space-y-2">
              {travellers.map(t => (
                <label key={t} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={splitBetween.includes(t)}
                    onCheckedChange={() => toggleSplit(t)}
                  />
                  <span className="text-sm">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;
