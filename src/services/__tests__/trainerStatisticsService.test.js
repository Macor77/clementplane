import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../../lib/supabaseClient', () => ({ supabase: mocks }));
import { getMyActivityExpenses } from '../trainerActivityService';
import { getMonthlyGoal, saveMonthlyGoal, deleteMonthlyGoal } from '../trainerStatisticsService';
beforeEach(() => vi.clearAllMocks());
it('paginates only the current owner expense items without fetching other private notes', async () => {
  const q = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => ({ report_id: i })) }).mockResolvedValueOnce({ data: [{ report_id: 500 }] }) };
  mocks.from.mockReturnValue(q);
  expect(await getMyActivityExpenses('owner')).toHaveLength(501);
  expect(q.eq).toHaveBeenCalledWith('owner_user_id', 'owner'); expect(q.select).toHaveBeenCalledWith('report_id,expense_items');
  expect(q.range.mock.calls).toEqual([[0, 499], [500, 999]]);
});
it('rejects absent owner and propagates private-query errors instead of returning a zero', async () => {
  await expect(getMyActivityExpenses(null)).rejects.toThrow(); expect(mocks.from).not.toHaveBeenCalled();
  const q = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValue({ error: new Error('Network') }) }; mocks.from.mockReturnValue(q);
  await expect(getMyActivityExpenses('owner')).rejects.toThrow('Network');
});
it('requires valid goal data and a server-confirmed save/deletion scoped to owner and month', async () => {
  const goal = { month: '2026-11-01', metric: 'days', target: 2.5 };
  const q = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), upsert: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: goal }), maybeSingle: vi.fn().mockResolvedValue({ data: goal }) }; mocks.from.mockReturnValue(q);
  expect(await getMonthlyGoal('owner', goal.month)).toEqual(goal);
  expect(q.eq.mock.calls).toEqual([['owner_user_id', 'owner'], ['month', '2026-11-01']]);
  await expect(saveMonthlyGoal('owner', { ...goal, target: 0 })).rejects.toThrow(); expect(q.upsert).not.toHaveBeenCalled();
  await expect(saveMonthlyGoal('owner', { ...goal, target: '2,5', forged: true })).resolves.toEqual(goal);
  expect(q.upsert).toHaveBeenCalledWith({ owner_user_id: 'owner', ...goal }, { onConflict: 'owner_user_id,month' });
  q.single.mockResolvedValue({ data: null }); await expect(saveMonthlyGoal('owner', goal)).rejects.toThrow(/Confirmation/);
  q.maybeSingle.mockResolvedValue({ error: new Error('Network') }); await expect(deleteMonthlyGoal('owner', goal.month)).rejects.toThrow('Network');
});
