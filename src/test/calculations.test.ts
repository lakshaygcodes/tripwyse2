import { describe, it, expect } from 'vitest';
import { getBalancesWithSettlements, getSettlementsFromBalances } from '@/lib/supabaseTripStore';

describe('getBalancesWithSettlements', () => {
  it('returns zero balances when no expenses', () => {
    const balances = getBalancesWithSettlements([], [], ['Alice', 'Bob']);
    expect(balances).toEqual({ Alice: 0, Bob: 0 });
  });

  it('calculates simple split correctly', () => {
    const expenses = [
      { amount: 100, paidBy: 'Alice', splitBetween: ['Alice', 'Bob'] },
    ];
    const balances = getBalancesWithSettlements(expenses, [], ['Alice', 'Bob']);
    // Alice paid 100, split 50/50 => Alice +50, Bob -50
    expect(balances.Alice).toBeCloseTo(50);
    expect(balances.Bob).toBeCloseTo(-50);
  });

  it('handles multiple expenses', () => {
    const expenses = [
      { amount: 100, paidBy: 'Alice', splitBetween: ['Alice', 'Bob', 'Charlie'] },
      { amount: 60, paidBy: 'Bob', splitBetween: ['Alice', 'Bob', 'Charlie'] },
    ];
    const balances = getBalancesWithSettlements(expenses, [], ['Alice', 'Bob', 'Charlie']);
    // Alice: +100 - 33.33 - 20 = +46.67
    // Bob: +60 - 33.33 - 20 = +6.67
    // Charlie: -33.33 - 20 = -53.33
    expect(balances.Alice).toBeCloseTo(46.67, 1);
    expect(balances.Bob).toBeCloseTo(6.67, 1);
    expect(balances.Charlie).toBeCloseTo(-53.33, 1);
  });

  it('applies past settlements correctly', () => {
    const expenses = [
      { amount: 100, paidBy: 'Alice', splitBetween: ['Alice', 'Bob'] },
    ];
    const settlements = [{ from: 'Bob', to: 'Alice', amount: 50 }];
    const balances = getBalancesWithSettlements(expenses, settlements, ['Alice', 'Bob']);
    // After expense: Alice +50, Bob -50. After settlement: both 0
    expect(balances.Alice).toBeCloseTo(0);
    expect(balances.Bob).toBeCloseTo(0);
  });

  it('handles uneven splits', () => {
    const expenses = [
      { amount: 90, paidBy: 'Alice', splitBetween: ['Alice', 'Bob', 'Charlie'] },
    ];
    const balances = getBalancesWithSettlements(expenses, [], ['Alice', 'Bob', 'Charlie']);
    expect(balances.Alice).toBeCloseTo(60);
    expect(balances.Bob).toBeCloseTo(-30);
    expect(balances.Charlie).toBeCloseTo(-30);
  });

  it('handles expense not split with payer', () => {
    const expenses = [
      { amount: 100, paidBy: 'Alice', splitBetween: ['Bob', 'Charlie'] },
    ];
    const balances = getBalancesWithSettlements(expenses, [], ['Alice', 'Bob', 'Charlie']);
    // Alice paid 100, owes nothing => +100
    // Bob owes 50, Charlie owes 50
    expect(balances.Alice).toBeCloseTo(100);
    expect(balances.Bob).toBeCloseTo(-50);
    expect(balances.Charlie).toBeCloseTo(-50);
  });
});

describe('getSettlementsFromBalances', () => {
  it('returns empty when all balanced', () => {
    const settlements = getSettlementsFromBalances({ Alice: 0, Bob: 0 });
    expect(settlements).toHaveLength(0);
  });

  it('creates single settlement for two people', () => {
    const settlements = getSettlementsFromBalances({ Alice: 50, Bob: -50 });
    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toEqual({ from: 'Bob', to: 'Alice', amount: 50 });
  });

  it('minimizes transactions for three people', () => {
    const settlements = getSettlementsFromBalances({ Alice: 60, Bob: -30, Charlie: -30 });
    expect(settlements).toHaveLength(2);
    const totalPaid = settlements.reduce((s, t) => s + t.amount, 0);
    expect(totalPaid).toBeCloseTo(60);
  });

  it('handles complex balances', () => {
    const settlements = getSettlementsFromBalances({ Alice: 100, Bob: -60, Charlie: -40 });
    expect(settlements.length).toBeLessThanOrEqual(2);
    // Verify net flows
    const flows: Record<string, number> = {};
    settlements.forEach(s => {
      flows[s.from] = (flows[s.from] || 0) - s.amount;
      flows[s.to] = (flows[s.to] || 0) + s.amount;
    });
    expect(flows.Alice || 0).toBeCloseTo(100);
    expect(flows.Bob || 0).toBeCloseTo(-60);
    expect(flows.Charlie || 0).toBeCloseTo(-40);
  });

  it('ignores near-zero balances', () => {
    const settlements = getSettlementsFromBalances({ Alice: 0.001, Bob: -0.001 });
    expect(settlements).toHaveLength(0);
  });

  it('handles one creditor and three debtors', () => {
    const settlements = getSettlementsFromBalances({ Alice: 90, Bob: -30, Charlie: -30, Dave: -30 });
    const totalPaid = settlements.reduce((s, t) => s + t.amount, 0);
    expect(totalPaid).toBeCloseTo(90);
    settlements.forEach(s => expect(s.to).toBe('Alice'));
  });

  it('rounds settlement amounts to 2 decimal places', () => {
    // 100 / 3 = 33.333...
    const settlements = getSettlementsFromBalances({ Alice: 66.67, Bob: -33.33, Charlie: -33.34 });
    settlements.forEach(s => {
      expect(Number(s.amount.toFixed(2))).toBe(s.amount);
    });
  });
});

describe('date validation', () => {
  const validateDates = (start: string, end: string) =>
    start && end && end < start ? 'End date cannot be before start date' : null;

  it('returns null when end equals start', () => {
    expect(validateDates('2026-04-01', '2026-04-01')).toBeNull();
  });

  it('returns null when end is after start', () => {
    expect(validateDates('2026-04-01', '2026-04-10')).toBeNull();
  });

  it('returns error when end is before start', () => {
    expect(validateDates('2026-04-10', '2026-04-01')).toBe('End date cannot be before start date');
  });

  it('returns null when start is empty', () => {
    expect(validateDates('', '2026-04-01')).toBeNull();
  });

  it('returns null when end is empty', () => {
    expect(validateDates('2026-04-01', '')).toBeNull();
  });
});
