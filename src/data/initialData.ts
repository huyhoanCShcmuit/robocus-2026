import type { CompetitionData, MatchResultA, MatchResultC } from '../types';

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
// Generate exactly 18 matches for 9 teams (each team plays exactly 4 matches)
for (let step = 1; step <= 2; step++) {
  for (let i = 0; i < defaultTeamsA.length; i++) {
    const j = (i + step) % defaultTeamsA.length;
    const t1 = Math.min(i, j);
    const t2 = Math.max(i, j);
    const roundIdx = Math.floor(matchCount / 2); // 9 rounds of 2 matches = 18 matches
    defaultMatchesA.push({
      id: `ma_${defaultTeamsA[t1].id}_${defaultTeamsA[t2].id}`,
      matchIdx: roundIdx,
      team1Id: defaultTeamsA[t1].id,
      team2Id: defaultTeamsA[t2].id,
      score1: null,
      score2: null,
      winnerId: null,
    });
    matchCount++;
  }
}

// BẢNG C: Đầy đủ 5 Đội (C01 đến C05) - Trận đấu khởi tạo tỷ số 0-0
const defaultTeamsC = [
  { id: 'c1', name: 'C01', division: 'C' as const },
  { id: 'c2', name: 'C02', division: 'C' as const },
  { id: 'c3', name: 'C03', division: 'C' as const },
  { id: 'c4', name: 'C04', division: 'C' as const },
  { id: 'c5', name: 'C05', division: 'C' as const },
];

const defaultMatchesC: MatchResultC[] = [];
// Generate Lượt đi (Leg 1) - All unique pairs
for (let i = 0; i < defaultTeamsC.length; i++) {
  for (let j = i + 1; j < defaultTeamsC.length; j++) {
    defaultMatchesC.push({
      id: `mc_${defaultTeamsC[i].id}_${defaultTeamsC[j].id}_l1`,
      team1Id: defaultTeamsC[i].id,
      team2Id: defaultTeamsC[j].id,
      score1: 0,
      score2: 0,
      isCompleted: false,
      leg: 1,
    });
  }
}
// Generate Lượt về (Leg 2) - Reversed home/away teams for all unique pairs
for (let i = 0; i < defaultTeamsC.length; i++) {
  for (let j = i + 1; j < defaultTeamsC.length; j++) {
    defaultMatchesC.push({
      id: `mc_${defaultTeamsC[i].id}_${defaultTeamsC[j].id}_l2`,
      team1Id: defaultTeamsC[j].id,
      team2Id: defaultTeamsC[i].id,
      score1: 0,
      score2: 0,
      isCompleted: false,
      leg: 2,
    });
  }
}

export const INITIAL_COMPETITION_DATA: CompetitionData = {
  version: 7,
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

  // BẢNG A: Đầy đủ 9 Đội (A01 đến A09) & 18 trận đấu vòng tròn
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

  // BẢNG C: Đầy đủ 5 Đội (C01 đến C05) & 20 trận vòng tròn 2 lượt
  teamsC: defaultTeamsC,
  matchesC: defaultMatchesC,

  // TIMER ĐẾM NGƯỢC LẮP RÁP & LẬP TRÌNH ROBOT (60 Phút)
  timer: {
    totalSeconds: 3600,
    remainingSeconds: 3600,
    targetEndTime: null,
    isRunning: false,
    title: 'THỜI GIAN LẮP RÁP & LẬP TRÌNH ROBOT',
  },

  lastUpdated: Date.now(),
};
