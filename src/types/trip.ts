export type ExpenseCategory = 'food' | 'transport' | 'stay' | 'activities' | 'shopping' | 'other';

export const CATEGORY_CONFIG: Record<ExpenseCategory, { icon: string; label: string }> = {
  food: { icon: '🍜', label: 'Food' },
  transport: { icon: '🚕', label: 'Transport' },
  stay: { icon: '🏨', label: 'Stay' },
  activities: { icon: '🎟️', label: 'Activities' },
  shopping: { icon: '🛍️', label: 'Shopping' },
  other: { icon: '📦', label: 'Other' },
};

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  category: ExpenseCategory;
  date: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  travellers: string[];
  expenses: Expense[];
  createdAt: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}
