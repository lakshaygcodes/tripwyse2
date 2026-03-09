import { ExpenseCategory, CATEGORY_CONFIG } from '@/types/trip';

interface Props {
  selectedCategory: ExpenseCategory | 'all';
  onCategoryChange: (cat: ExpenseCategory | 'all') => void;
  sortBy: 'date' | 'amount';
  onSortChange: (sort: 'date' | 'amount') => void;
}

const ExpenseFilters = ({ selectedCategory, onCategoryChange, sortBy, onSortChange }: Props) => {
  return (
    <div className="space-y-3 mb-4">
      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          All
        </button>
        {(Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, { icon: string; label: string }][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {val.icon} {val.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-2 items-center">
        <span className="text-xs text-muted-foreground">Sort:</span>
        {(['date', 'amount'] as const).map(s => (
          <button
            key={s}
            onClick={() => onSortChange(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              sortBy === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {s === 'date' ? '📅 Date' : '💰 Amount'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExpenseFilters;
