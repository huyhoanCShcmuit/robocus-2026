import type { CompetitionData, MatchResultA } from '../types';

const defaultTeamsA = [
  { id: 'a1', name: 'A01', division: 'A' as const, wins: 0, scores: [null, null, null, null, null, null, null, null] },
  { id: 'a2', name: 'A02', division: 'A' as const, wins: 0, scores: [null, null, null, null, null, null, null, null] },
  { id: 'a3', name: 'A03', division: 'A' as const, wins: 0, scores: [null, null, null, null, null, null, null, null] },
  { id: 'a4', name: 'A04', division: 'A' as const, wins: 0, scores: [null, null, null, null, null, null, null, null] },
  { id: 'a5', name: 'A05', division: 'A' as const, wins: 0, scores: [null, null, null, null, null, null, null, null] },
  { id: 'a6', name: 'A06', division: 'A' as const, wins: 0, scores: [null, null, null, null, null, null, null, null] },
  { id: 'a7', name: 'A07', division: 'A' as const, wins: 0, scores: [null, null, null, null, null, null, null, null] },
  { id: 'a8', name: 'A08', division: 'A' as const, wins: 0, scores: [null, null, null, null, null, null, null, null] },
  { id: 'a9', name: 'A09', division: 'A' as const, wins: 0, scores: [null, null, null, null, null, null, null, null] },
];

const defaultMatchesA: MatchResultA[] = [];
let matchCount = 0;
for (let i = 0; i < defaultTeamsA.length; i++) {
  for (let j = i + 1; j < defaultTeamsA.length; j++) {
    const roundIdx = Math.floor(matchCount / 4); // 9 rounds of 4 matches = 36 matches
    defaultMatchesA.push({
      id: `ma_${defaultTeamsA[i].id}_${defaultTeamsA[j].id}`,
      matchIdx: roundIdx,
      team1Id: defaultTeamsA[i].id,
      team2Id: defaultTeamsA[j].id,
      score1: null,
      score2: null,
      winnerId: null,
    });
    matchCount++;
  }
}

export const INITIAL_COMPETITION_DATA: CompetitionData = {
  version: 6,
  settings: {
    title: 'BẢNG XẾP HẠNG',
    subtitle: 'ROBOCUS 2026 - CUỘC THI GIẢI PHÁP SÁNG TẠO ROBOT',
    autoRefreshInterval: 3000,
    autoRankingEnabled: true,
    customRankColors: {
      rank1: '#ffcc00', // Gold
      rank2: '#e0e0e0', // Silver
      rank3: '#cd7f32', // Bronze
      rank4Plus: '#a85c18', // Brown
    },
    allowTiedRanks: true,
  },

  // BẢNG A: Đầy đủ 9 Đội (A01 đến A09) & 36 trận đấu vòng tròn
  teamsA: defaultTeamsA,
  matchesA: defaultMatchesA,

  // BẢNG B - MINDSTORMS EV3: Đầy đủ 8 Đội (EV3-01 đến EV3-08) - Khởi tạo 5 lượt x 8 nhiệm vụ = 0
  teamsB_EV3: Array.from({ length: 8 }).map((_, idx) => ({
    id: `ev3_${idx + 1}`,
    name: `EV3-${(idx + 1).toString().padStart(2, '0')}`,
    division: 'B_EV3' as const,
    rounds: Array.from({ length: 5 }).map((__, rIdx) => ({
      roundIndex: rIdx,
      tasks: new Array(8).fill(0),
    })),
  })),

  // BẢNG B - SPIKE PRIME: Đầy đủ 4 Đội (SPIKE-01 đến SPIKE-04) - Khởi tạo 5 lượt x 8 nhiệm vụ = 0
  teamsB_SPIKE: Array.from({ length: 4 }).map((_, idx) => ({
    id: `spike_${idx + 1}`,
    name: `SPIKE-${(idx + 1).toString().padStart(2, '0')}`,
    division: 'B_SPIKE' as const,
    rounds: Array.from({ length: 5 }).map((__, rIdx) => ({
      roundIndex: rIdx,
      tasks: new Array(8).fill(0),
    })),
  })),

  // BẢNG C: Đầy đủ 5 Đội (C01 đến C05) - Trận đấu khởi tạo tỷ số 0-0
  teamsC: [
    { id: 'c1', name: 'C01', division: 'C' },
    { id: 'c2', name: 'C02', division: 'C' },
    { id: 'c3', name: 'C03', division: 'C' },
    { id: 'c4', name: 'C04', division: 'C' },
    { id: 'c5', name: 'C05', division: 'C' },
  ],
  matchesC: [
    { id: 'mc1', team1Id: 'c1', team2Id: 'c2', score1: 0, score2: 0, isCompleted: false },
    { id: 'mc2', team1Id: 'c3', team2Id: 'c4', score1: 0, score2: 0, isCompleted: false },
    { id: 'mc3', team1Id: 'c1', team2Id: 'c3', score1: 0, score2: 0, isCompleted: false },
    { id: 'mc4', team1Id: 'c2', team2Id: 'c5', score1: 0, score2: 0, isCompleted: false },
    { id: 'mc5', team1Id: 'c4', team2Id: 'c5', score1: 0, score2: 0, isCompleted: false },
  ],

  lastUpdated: Date.now(),
};
