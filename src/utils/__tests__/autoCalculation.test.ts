import { describe, it, expect } from 'vitest';
import type { TeamA, TeamB, TeamC, MatchResultC } from '../../types';
import { autoCalculateTeamA, autoCalculateTeamB, autoCalculateTeamC } from '../autoCalculation';
import { calculateRankingsB, calculateRankingsC } from '../rankingEngine';

describe('autoCalculateTeamA', () => {
  const base: TeamA = { id: 'a1', name: 'A01', division: 'A', scores: [60, null, 40, 50] };

  it('sums scores and counts wins from matches', () => {
    const result = autoCalculateTeamA(base, [
      { id: 'm1', team1Id: 'a1', team2Id: 'a2', winnerId: 'a1', score1: 1, score2: 0 },
    ]);
    expect(result.totalScore).toBe(150);
    expect(result.wins).toBe(1);
  });

  it('falls back to counting scores >= 50 when no match wins exist', () => {
    expect(autoCalculateTeamA(base, []).wins).toBe(2);
  });

  it('keeps an explicitly set wins value', () => {
    expect(autoCalculateTeamA({ ...base, wins: 7 }, []).wins).toBe(7);
  });
});

describe('autoCalculateTeamB', () => {
  it('matches the ranking engine stats', () => {
    const team: TeamB = {
      id: 'b1',
      name: 'EV3-01',
      division: 'B_EV3',
      rounds: [
        { roundIndex: 0, tasks: [20, 10, null, 0, 0, 0, 0, 0] },
        { roundIndex: 1, tasks: [10, 20, 15, 0, 0, 0, 0, 0] },
      ],
    };
    const auto = autoCalculateTeamB(team);
    const [ranked] = calculateRankingsB([team]);
    expect(auto.totalScore).toBe(ranked.totalScore);
    expect(auto.completedTasksCount).toBe(ranked.completedTasksCount);
    expect(auto.maxRoundScore).toBe(ranked.maxRoundScore);
    expect(auto.bestRoundIndices).toEqual(ranked.bestRoundIndices);
    expect(auto.taskMaxScores).toEqual([20, 20, 15, 0, 0, 0, 0, 0]);
  });
});

describe('autoCalculateTeamC', () => {
  it('matches the ranking engine stats', () => {
    const team: TeamC = { id: 'c1', name: 'C01', division: 'C' };
    const matches: MatchResultC[] = [
      { id: 'm1', team1Id: 'c1', team2Id: 'c2', score1: 2, score2: 0, isCompleted: true },
      { id: 'm2', team1Id: 'c2', team2Id: 'c1', score1: 1, score2: 1, isCompleted: true },
      { id: 'm3', team1Id: 'c3', team2Id: 'c1', score1: 4, score2: 0, isCompleted: true },
      { id: 'm4', team1Id: 'c1', team2Id: 'c3', score1: 5, score2: 0, isCompleted: false },
    ];
    const auto = autoCalculateTeamC(team, matches);
    const ranked = calculateRankingsC([team], matches)[0];
    expect(auto).toMatchObject({
      wins: 1,
      draws: 1,
      losses: 1,
      points: 4,
      goalsFor: 3,
      goalsAgainst: 5,
      goalDifference: -2,
    });
    expect(auto.points).toBe(ranked.points);
    expect(auto.goalDifference).toBe(ranked.goalDifference);
  });
});
