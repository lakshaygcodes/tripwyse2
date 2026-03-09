import { Trip, Expense, Settlement } from '@/types/trip';

const STORAGE_KEY = 'tripwise_trips';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getTrips(): Record<string, Trip> {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveTrips(trips: Record<string, Trip>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function createTrip(data: Omit<Trip, 'id' | 'expenses' | 'createdAt'>): Trip {
  const trips = getTrips();
  const trip: Trip = {
    ...data,
    id: generateId(),
    expenses: [],
    createdAt: new Date().toISOString(),
  };
  trips[trip.id] = trip;
  saveTrips(trips);
  return trip;
}

export function getTrip(id: string): Trip | null {
  return getTrips()[id] || null;
}

export function addExpense(tripId: string, data: Omit<Expense, 'id'>): Expense | null {
  const trips = getTrips();
  const trip = trips[tripId];
  if (!trip) return null;
  const expense: Expense = { ...data, id: generateId() };
  trip.expenses.push(expense);
  saveTrips(trips);
  return expense;
}

export function deleteExpense(tripId: string, expenseId: string): boolean {
  const trips = getTrips();
  const trip = trips[tripId];
  if (!trip) return false;
  trip.expenses = trip.expenses.filter(e => e.id !== expenseId);
  saveTrips(trips);
  return true;
}

export function getBalances(trip: Trip): Record<string, number> {
  const balances: Record<string, number> = {};
  trip.travellers.forEach(t => (balances[t] = 0));

  trip.expenses.forEach(exp => {
    const share = exp.amount / exp.splitBetween.length;
    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount;
    exp.splitBetween.forEach(person => {
      balances[person] = (balances[person] || 0) - share;
    });
  });

  return balances;
}

export function getSettlements(trip: Trip): Settlement[] {
  const balances = getBalances(trip);
  const debtors: { name: string; amount: number }[] = [];
  const creditors: { name: string; amount: number }[] = [];

  Object.entries(balances).forEach(([name, balance]) => {
    if (balance < -0.01) debtors.push({ name, amount: -balance });
    else if (balance > 0.01) creditors.push({ name, amount: balance });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.01) {
      settlements.push({
        from: debtors[i].name,
        to: creditors[j].name,
        amount: Math.round(amount * 100) / 100,
      });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return settlements;
}

export function getTotalSpend(trip: Trip): number {
  return trip.expenses.reduce((sum, e) => sum + e.amount, 0);
}
