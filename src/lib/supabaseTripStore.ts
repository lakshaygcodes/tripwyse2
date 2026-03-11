import { supabase } from '@/integrations/supabase/client';
import { Settlement } from '@/types/trip';

export async function createTripInDB(data: {
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  // Generate join code
  const { data: joinCode } = await supabase.rpc('generate_join_code');

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      name: data.name,
      start_date: data.startDate,
      end_date: data.endDate,
      currency: data.currency,
      join_code: joinCode || Math.floor(10000 + Math.random() * 90000).toString(),
      created_by: userData.user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-add the creator as the first member
  const creatorName =
    userData.user.user_metadata?.full_name ||
    userData.user.user_metadata?.name ||
    userData.user.email?.split('@')[0] ||
    'Me';

  await supabase.from('trip_members').insert({
    trip_id: trip.id,
    name: creatorName,
    user_id: userData.user.id,
  });

  return trip;
}

export async function getTripFromDB(tripId: string) {
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error) return null;

  const { data: members } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId);

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  const { data: settlements } = await supabase
    .from('settlements')
    .select('*')
    .eq('trip_id', tripId)
    .order('settled_at', { ascending: true });

  return {
    id: trip.id,
    name: trip.name,
    startDate: trip.start_date || '',
    endDate: trip.end_date || '',
    currency: trip.currency,
    joinCode: trip.join_code,
    travellers: (members || []).map(m => m.name),
    expenses: (expenses || []).map(e => ({
      id: e.id,
      description: e.description,
      amount: Number(e.amount),
      paidBy: e.paid_by,
      splitBetween: e.split_between,
      category: e.category as any,
      date: e.date,
    })),
    pastSettlements: (settlements || []).map(s => ({
      from: s.from_name,
      to: s.to_name,
      amount: Number(s.amount),
    })),
    createdAt: trip.created_at,
  };
}

export async function addExpenseToDB(tripId: string, data: {
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  category: string;
  date: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from('expenses').insert({
    trip_id: tripId,
    description: data.description,
    amount: data.amount,
    paid_by: data.paidBy,
    split_between: data.splitBetween,
    category: data.category,
    date: data.date,
    created_by: userData.user?.id || null,
  });
  if (error) throw error;
}

export async function updateExpenseInDB(expenseId: string, data: {
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  category: string;
  date: string;
}) {
  const { error } = await supabase.from('expenses').update({
    description: data.description,
    amount: data.amount,
    paid_by: data.paidBy,
    split_between: data.splitBetween,
    category: data.category,
    date: data.date,
  }).eq('id', expenseId);
  if (error) throw error;
}

export async function deleteExpenseFromDB(expenseId: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

export async function addSettlementToDB(tripId: string, settlement: Settlement) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from('settlements').insert({
    trip_id: tripId,
    from_name: settlement.from,
    to_name: settlement.to,
    amount: settlement.amount,
    created_by: userData.user?.id || null,
  });
  if (error) throw error;
}

export async function joinTripByCode(code: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('join_code', code)
    .single();

  if (tripError || !trip) throw new Error('Trip not found. Check the code and try again.');

  // Resolve name from auth profile
  const memberName =
    userData.user.user_metadata?.full_name ||
    userData.user.user_metadata?.name ||
    userData.user.email?.split('@')[0] ||
    'Traveller';

  // Add as member
  const { error: memberError } = await supabase.from('trip_members').insert({
    trip_id: trip.id,
    name: memberName,
    user_id: userData.user.id,
  });

  if (memberError) {
    if (memberError.code === '23505') {
      throw new Error('You are already a member of this trip.');
    }
    throw memberError;
  }

  return trip;
}

export async function getUserTrips() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data: memberships } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', userData.user.id);

  if (!memberships || memberships.length === 0) return [];

  const tripIds = memberships.map(m => m.trip_id);
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .in('id', tripIds)
    .order('created_at', { ascending: false });

  return trips || [];
}

// Calculate balances considering past settlements
export function getBalancesWithSettlements(
  expenses: { amount: number; paidBy: string; splitBetween: string[] }[],
  pastSettlements: Settlement[],
  travellers: string[]
): Record<string, number> {
  const balances: Record<string, number> = {};
  travellers.forEach(t => (balances[t] = 0));

  expenses.forEach(exp => {
    const share = exp.amount / exp.splitBetween.length;
    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount;
    exp.splitBetween.forEach(person => {
      balances[person] = (balances[person] || 0) - share;
    });
  });

  // Apply past settlements
  pastSettlements.forEach(s => {
    balances[s.from] = (balances[s.from] || 0) + s.amount;
    balances[s.to] = (balances[s.to] || 0) - s.amount;
  });

  return balances;
}

export function getSettlementsFromBalances(balances: Record<string, number>): Settlement[] {
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
