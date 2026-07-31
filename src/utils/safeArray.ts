import type { TeamC, MatchResultC } from '../types';

export function toSafeArray<T>(val: any): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') {
    return Object.values(val) as T[];
  }
  return [];
}

/**
 * Ensures a complete round-robin match list for Bảng C (both Lượt Đi and Lượt Về).
 * Preserves all existing match scores, states, and IDs.
 */
export function ensureFullMatchesC(teamsCInput: any, matchesCInput: any): MatchResultC[] {
  const teams = toSafeArray<TeamC>(teamsCInput);
  const matches = toSafeArray<MatchResultC>(matchesCInput);

  if (teams.length < 2) return matches;

  const teamIds = new Set(teams.map((t) => t.id));

  // Map existing matches by lookup key `${team1Id}__${team2Id}__${leg}`
  const existingMap = new Map<string, MatchResultC>();
  matches.forEach((m) => {
    if (!m || !m.team1Id || !m.team2Id) return;
    if (!teamIds.has(m.team1Id) || !teamIds.has(m.team2Id)) return;

    const leg = m.leg || 1;
    const key = `${m.team1Id}__${m.team2Id}__${leg}`;
    existingMap.set(key, m);
  });

  const result: MatchResultC[] = [];

  // Generate full round robin pairs for Leg 1 (t1 vs t2) and Leg 2 (t2 vs t1)
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const t1 = teams[i].id;
      const t2 = teams[j].id;

      // --- LEG 1: t1 vs t2 ---
      const key1Direct = `${t1}__${t2}__1`;
      const key1Reverse = `${t2}__${t1}__1`;

      if (existingMap.has(key1Direct)) {
        result.push(existingMap.get(key1Direct)!);
      } else if (existingMap.has(key1Reverse)) {
        result.push(existingMap.get(key1Reverse)!);
      } else {
        result.push({
          id: `mc_${t1}_${t2}_l1`,
          team1Id: t1,
          team2Id: t2,
          score1: 0,
          score2: 0,
          isCompleted: false,
          leg: 1,
        });
      }

      // --- LEG 2: t2 vs t1 ---
      const key2Direct = `${t2}__${t1}__2`;
      const key2Reverse = `${t1}__${t2}__2`;

      if (existingMap.has(key2Direct)) {
        result.push(existingMap.get(key2Direct)!);
      } else if (existingMap.has(key2Reverse)) {
        result.push(existingMap.get(key2Reverse)!);
      } else {
        result.push({
          id: `mc_${t1}_${t2}_l2`,
          team1Id: t2,
          team2Id: t1,
          score1: 0,
          score2: 0,
          isCompleted: false,
          leg: 2,
        });
      }
    }
  }

  return result;
}
