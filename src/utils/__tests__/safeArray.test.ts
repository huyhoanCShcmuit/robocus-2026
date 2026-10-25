import { describe, it, expect } from 'vitest';
import type { TeamA, TeamC, MatchResultA, MatchResultC } from '../../types';
import { toSafeArray, ensureFullMatchesA, ensureFullMatchesC } from '../safeArray';

const teamsA = (n: number): TeamA[] =>
  Array.from({ length: n }, (_, i) => ({ id: `a${i + 1}`, name: `A0${i + 1}`, division: 'A', scores: [] }));

const teamsC = (n: number): TeamC[] =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i + 1}`, name: `C0${i + 1}`, division: 'C' }));

describe('toSafeArray', () => {
  it('returns arrays unchanged', () => {
    const arr = [1, 2, 3];
    expect(toSafeArray(arr)).toBe(arr);
  });

  it('converts Firebase-style objects to arrays', () => {
    expect(toSafeArray({ 0: 'a', 1: 'b' })).toEqual(['a', 'b']);
  });

  it('returns [] for null, undefined and primitives', () => {
    expect(toSafeArray(null)).toEqual([]);
    expect(toSafeArray(undefined)).toEqual([]);
    expect(toSafeArray(42)).toEqual([]);
    expect(toSafeArray('abc')).toEqual([]);
  });
});

describe('ensureFullMatchesA', () => {
  it('returns [] when fewer than 2 teams', () => {
    expect(ensureFullMatchesA(teamsA(1), [])).toEqual([]);
    expect(ensureFullMatchesA(undefined, undefined)).toEqual([]);
  });

  it('generates every pair exactly once (n*(n-1)/2)', () => {
    const result = ensureFullMatchesA(teamsA(9), []);
    expect(result).toHaveLength(36);
    const keys = new Set(result.map((m) => [m.team1Id, m.team2Id].sort().join('__')));
    expect(keys.size).toBe(36);
    expect(result.every((m) => m.team1Id !== m.team2Id)).toBe(true);
  });

  it('groups 4 matches per round index', () => {
    const result = ensureFullMatchesA(teamsA(5), []);
    expect(result.map((m) => m.matchIdx)).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 2, 2]);
  });

  it('creates new matches with empty scores', () => {
    const [m] = ensureFullMatchesA(teamsA(2), []);
    expect(m).toEqual({
      id: 'ma_a1_a2',
      matchIdx: 0,
      team1Id: 'a1',
      team2Id: 'a2',
      score1: null,
      score2: null,
      winnerId: null,
    });
  });

  it('preserves existing results, even when stored in reverse order', () => {
    const existing: MatchResultA = {
      id: 'custom',
      team1Id: 'a2',
      team2Id: 'a1',
      score1: 40,
      score2: 30,
      winnerId: 'a2',
    };
    const result = ensureFullMatchesA(teamsA(3), [existing]);
    expect(result).toHaveLength(3);
    const kept = result.find((m) => m.id === 'custom')!;
    expect(kept).toMatchObject({ team1Id: 'a2', team2Id: 'a1', score1: 40, score2: 30, winnerId: 'a2', matchIdx: 0 });
  });

  it('drops matches that reference deleted teams', () => {
    const stale: MatchResultA = { id: 'old', team1Id: 'a1', team2Id: 'zz', score1: 1, score2: 0, winnerId: 'a1' };
    const result = ensureFullMatchesA(teamsA(2), [stale]);
    expect(result.map((m) => m.id)).toEqual(['ma_a1_a2']);
  });
});

describe('ensureFullMatchesC', () => {
  it('returns the input unchanged when fewer than 2 teams', () => {
    const matches: MatchResultC[] = [];
    expect(ensureFullMatchesC(teamsC(1), matches)).toBe(matches);
  });

  it('generates both legs for every pair with swapped home/away', () => {
    const result = ensureFullMatchesC(teamsC(4), []);
    expect(result).toHaveLength(12);
    expect(result.filter((m) => m.leg === 1)).toHaveLength(6);
    expect(result.filter((m) => m.leg === 2)).toHaveLength(6);

    const leg1 = result.find((m) => m.id === 'mc_c1_c2_l1')!;
    const leg2 = result.find((m) => m.id === 'mc_c1_c2_l2')!;
    expect([leg1.team1Id, leg1.team2Id]).toEqual(['c1', 'c2']);
    expect([leg2.team1Id, leg2.team2Id]).toEqual(['c2', 'c1']);
    expect(leg2).toMatchObject({ score1: 0, score2: 0, isCompleted: false });
  });

  it('keeps existing results and treats missing leg as leg 1', () => {
    const legacy: MatchResultC = { id: 'legacy', team1Id: 'c2', team2Id: 'c1', score1: 3, score2: 1, isCompleted: true };
    const result = ensureFullMatchesC(teamsC(2), [legacy]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(legacy);
    expect(result[1].id).toBe('mc_c1_c2_l2');
  });
});
