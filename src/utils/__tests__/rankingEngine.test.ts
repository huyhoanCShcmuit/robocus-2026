import { describe, it, expect } from 'vitest';
import type { TeamA, MatchResultA, TeamB, TeamC, MatchResultC } from '../../types';
import { calculateRankingsA, calculateRankingsB, calculateRankingsC } from '../rankingEngine';

// ---------- helpers ----------
const teamA = (id: string, scores: (number | null)[] = [], extra: Partial<TeamA> = {}): TeamA => ({
  id,
  name: id.toUpperCase(),
  division: 'A',
  scores,
  ...extra,
});

const matchA = (team1Id: string, team2Id: string, winnerId: string | null): MatchResultA => ({
  id: `ma_${team1Id}_${team2Id}`,
  team1Id,
  team2Id,
  winnerId,
  score1: null,
  score2: null,
});

const teamB = (id: string, rounds: (number | null)[][], extra: Partial<TeamB> = {}): TeamB => ({
  id,
  name: id.toUpperCase(),
  division: 'B_EV3',
  rounds: rounds.map((tasks, roundIndex) => ({ roundIndex, tasks })),
  ...extra,
});

const teamC = (id: string, extra: Partial<TeamC> = {}): TeamC => ({
  id,
  name: id.toUpperCase(),
  division: 'C',
  ...extra,
});

const matchC = (team1Id: string, team2Id: string, score1: number, score2: number, isCompleted = true): MatchResultC => ({
  id: `mc_${team1Id}_${team2Id}`,
  team1Id,
  team2Id,
  score1,
  score2,
  isCompleted,
});

const ids = (list: { id: string }[]) => list.map((t) => t.id);
const ranks = (list: { rank: number }[]) => list.map((t) => t.rank);

// ==========================================
// BẢNG A
// ==========================================
describe('calculateRankingsA', () => {
  it('returns an empty list for missing input', () => {
    expect(calculateRankingsA()).toEqual([]);
    expect(calculateRankingsA(undefined as any, undefined as any)).toEqual([]);
  });

  it('sums T1..T8 scores, treating null as 0', () => {
    const [t] = calculateRankingsA([teamA('a1', [10, null, 20, 0, null, 5, null, null])]);
    expect(t.totalScore).toBe(35);
  });

  it('counts wins from matches, ignoring the stored wins field', () => {
    const teams = [teamA('a1', [], { wins: 99 }), teamA('a2')];
    const matches = [matchA('a1', 'a2', 'a1'), matchA('a1', 'a2', 'a1'), matchA('a1', 'a2', null)];
    const result = calculateRankingsA(teams, matches);
    expect(result.find((t) => t.id === 'a1')!.wins).toBe(2);
    expect(result.find((t) => t.id === 'a2')!.wins).toBe(0);
  });

  it('ranks by wins first, then total score', () => {
    const teams = [teamA('a1', [100]), teamA('a2', [10]), teamA('a3', [50])];
    const matches = [matchA('a2', 'a1', 'a2'), matchA('a3', 'a1', 'a3')];
    // a2 & a3 have 1 win each; a3 has more points. a1 has the most points but 0 wins.
    const result = calculateRankingsA(teams, matches);
    expect(ids(result)).toEqual(['a3', 'a2', 'a1']);
    expect(ranks(result)).toEqual([1, 2, 3]);
  });

  it('gives tied teams the same rank and skips the next rank', () => {
    const teams = [teamA('a1', [30]), teamA('a2', [30]), teamA('a3', [10])];
    const result = calculateRankingsA(teams, []);
    expect(ranks(result)).toEqual([1, 1, 3]);
    expect(result.map((t) => t.isTied)).toEqual([true, true, false]);
  });

  it('accepts Firebase-style objects instead of arrays', () => {
    const teams = { x: teamA('a1', { 0: 5, 1: 7 } as any), y: teamA('a2', [1]) } as any;
    const matches = { m: matchA('a2', 'a1', 'a2') } as any;
    const result = calculateRankingsA(teams, matches);
    expect(ids(result)).toEqual(['a2', 'a1']);
    expect(result[1].totalScore).toBe(12);
  });

  describe('manual medal mode', () => {
    it('orders by medal, then wins, then score, with sequential ranks', () => {
      const teams = [
        teamA('a1', [100], { customMedal: 'BRONZE' }),
        teamA('a2', [10], { customMedal: 'GOLD' }),
        teamA('a3', [50]),
        teamA('a4', [80]),
        teamA('a5', [5], { customMedal: 'SILVER' }),
      ];
      const matches = [matchA('a3', 'a4', 'a3')];
      const result = calculateRankingsA(teams, matches, false);
      // a3 & a4 have no medal: a3 wins tie-break on wins despite lower score
      expect(ids(result)).toEqual(['a2', 'a5', 'a1', 'a3', 'a4']);
      expect(ranks(result)).toEqual([1, 2, 3, 4, 5]);
      expect(result.every((t) => !t.isTied)).toBe(true);
    });

    it('treats NONE the same as no medal and breaks ties by score', () => {
      const teams = [teamA('a1', [10], { customMedal: 'NONE' }), teamA('a2', [20])];
      expect(ids(calculateRankingsA(teams, [], false))).toEqual(['a2', 'a1']);
    });
  });
});

// ==========================================
// BẢNG B
// ==========================================
describe('calculateRankingsB', () => {
  it('returns an empty list for missing input', () => {
    expect(calculateRankingsB()).toEqual([]);
  });

  it('takes the best score per task across rounds (not the sum)', () => {
    const [t] = calculateRankingsB([
      teamB('b1', [
        [20, 10, 0, 0, 0, 0, 0, 0],
        [10, 15, 5, 0, 0, 0, 0, 0],
      ]),
    ]);
    expect(t.taskMaxScores).toEqual([20, 15, 5, 0, 0, 0, 0, 0]);
    expect(t.totalScore).toBe(40);
    expect(t.completedTasksCount).toBe(3);
    expect(t.roundTotals).toEqual([30, 30]);
    expect(t.maxRoundScore).toBe(30);
    expect(t.bestRoundIndices).toEqual([0, 1]);
  });

  it('caps the total score at 120', () => {
    const [t] = calculateRankingsB([teamB('b1', [[20, 20, 20, 20, 20, 20, 20, 20]])]);
    expect(t.totalScore).toBe(120);
    expect(t.completedTasksCount).toBe(8);
  });

  it('handles null scores and does not highlight all-zero rounds', () => {
    const [t] = calculateRankingsB([teamB('b1', [[null, null, null, null, null, null, null, null], [0, 0, 0, 0, 0, 0, 0, 0]])]);
    expect(t.totalScore).toBe(0);
    expect(t.maxRoundScore).toBe(0);
    expect(t.bestRoundIndices).toEqual([]);
  });

  it('handles a team with no rounds', () => {
    const [t] = calculateRankingsB([teamB('b1', [])]);
    expect(t.totalScore).toBe(0);
    expect(t.maxRoundScore).toBe(0);
    expect(t.roundTotals).toEqual([]);
  });

  it('ranks by total score, then completed tasks, then best round', () => {
    const teams = [
      // total 30, 1 task, best round 30
      teamB('b1', [[30, 0, 0, 0, 0, 0, 0, 0]]),
      // total 30, 2 tasks, best round 20 (split across rounds)
      teamB('b2', [[20, 0, 0, 0, 0, 0, 0, 0], [0, 10, 0, 0, 0, 0, 0, 0]]),
      // total 30, 2 tasks, best round 30
      teamB('b3', [[20, 10, 0, 0, 0, 0, 0, 0]]),
      // total 50
      teamB('b4', [[50, 0, 0, 0, 0, 0, 0, 0]]),
    ];
    const result = calculateRankingsB(teams);
    expect(ids(result)).toEqual(['b4', 'b3', 'b2', 'b1']);
    expect(ranks(result)).toEqual([1, 2, 3, 4]);
  });

  it('marks exact ties with the same rank', () => {
    const teams = [
      teamB('b1', [[10, 10, 0, 0, 0, 0, 0, 0]]),
      teamB('b2', [[10, 10, 0, 0, 0, 0, 0, 0]]),
      teamB('b3', [[5, 0, 0, 0, 0, 0, 0, 0]]),
    ];
    const result = calculateRankingsB(teams);
    expect(ranks(result)).toEqual([1, 1, 3]);
    expect(result.map((t) => t.isTied)).toEqual([true, true, false]);
  });

  it('orders by medal first in manual mode, then by the auto criteria', () => {
    const teams = [
      teamB('b1', [[50, 0, 0, 0, 0, 0, 0, 0]]),
      teamB('b2', [[10, 0, 0, 0, 0, 0, 0, 0]], { customMedal: 'GOLD' }),
      teamB('b3', [[20, 10, 0, 0, 0, 0, 0, 0]]),
      teamB('b4', [[30, 0, 0, 0, 0, 0, 0, 0]]),
    ];
    const result = calculateRankingsB(teams, false);
    expect(ids(result)).toEqual(['b2', 'b1', 'b3', 'b4']);
    expect(ranks(result)).toEqual([1, 2, 3, 4]);
  });
});

// ==========================================
// BẢNG C
// ==========================================
describe('calculateRankingsC', () => {
  it('returns an empty list for missing input', () => {
    expect(calculateRankingsC()).toEqual([]);
  });

  it('computes W/D/L, points, goals and ignores unfinished matches', () => {
    const teams = [teamC('c1'), teamC('c2'), teamC('c3')];
    const matches = [
      matchC('c1', 'c2', 3, 1),
      matchC('c2', 'c1', 2, 2),
      matchC('c3', 'c1', 1, 0),
      matchC('c1', 'c3', 9, 0, false), // not completed
    ];
    const c1 = calculateRankingsC(teams, matches).find((t) => t.id === 'c1')!;
    expect(c1).toMatchObject({
      matchesPlayed: 3,
      wins: 1,
      draws: 1,
      losses: 1,
      points: 4,
      goalsFor: 5,
      goalsAgainst: 4,
      goalDifference: 1,
    });
  });

  it('ranks by points, wins, draws, fewer losses, then goal difference', () => {
    const teams = [teamC('c1'), teamC('c2'), teamC('c3'), teamC('c4')];
    const matches = [
      // c1: 2 wins (6 pts), GD +2
      matchC('c1', 'c4', 1, 0),
      matchC('c1', 'c3', 1, 0),
      // c2: 2 wins (6 pts), GD +6
      matchC('c2', 'c4', 3, 0),
      matchC('c2', 'c3', 3, 0),
    ];
    const result = calculateRankingsC(teams, matches);
    expect(ids(result).slice(0, 2)).toEqual(['c2', 'c1']);
    expect(ranks(result).slice(0, 2)).toEqual([1, 2]);
  });

  it('prefers more wins over draws at equal points', () => {
    const teams = [teamC('c1'), teamC('c2'), teamC('c3'), teamC('c4'), teamC('c5')];
    const matches = [
      // c1: 1 win + 0 draws + 1 loss = 3 pts
      matchC('c1', 'c5', 1, 0),
      matchC('c1', 'c4', 0, 1),
      // c2: 3 draws = 3 pts
      matchC('c2', 'c3', 0, 0),
      matchC('c2', 'c3', 0, 0),
      matchC('c2', 'c5', 0, 0),
    ];
    const result = calculateRankingsC(teams, matches);
    const order = ids(result);
    expect(order.indexOf('c1')).toBeLessThan(order.indexOf('c2'));
  });

  it('gives identical records the same rank', () => {
    const teams = [teamC('c1'), teamC('c2'), teamC('c3')];
    const matches = [matchC('c1', 'c3', 1, 0), matchC('c2', 'c3', 1, 0)];
    const result = calculateRankingsC(teams, matches);
    expect(ranks(result)).toEqual([1, 1, 3]);
    expect(result.map((t) => t.isTied)).toEqual([true, true, false]);
  });

  it('orders by medal first in manual mode, then by points', () => {
    const teams = [teamC('c1'), teamC('c2', { customMedal: 'SILVER' }), teamC('c3'), teamC('c4', { customMedal: 'GOLD' })];
    const matches = [matchC('c1', 'c3', 2, 0), matchC('c3', 'c2', 1, 0)];
    const result = calculateRankingsC(teams, matches, false);
    expect(ids(result)).toEqual(['c4', 'c2', 'c1', 'c3']);
    expect(ranks(result)).toEqual([1, 2, 3, 4]);
  });
});
