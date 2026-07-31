export type DivisionId = 'A' | 'B_EV3' | 'B_SPIKE' | 'C';

export interface BaseTeam {
  id: string;
  name: string;
  division: DivisionId;
  avatarUrl?: string;
  customBadgeColor?: string;
  customMedal?: 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE';
}

// ----------------- BẢNG A -----------------
export interface TeamA extends BaseTeam {
  division: 'A';
  wins?: number; // Total wins count (Số trận thắng)
  scores: (number | null)[]; // T1 to T8 match scores
}

export interface MatchResultA {
  id: string;
  matchIdx?: number;
  team1Id: string;
  team2Id: string;
  winnerId: string | null; // null if draw or not played
  score1: number | null;
  score2: number | null;
}

export interface RankedTeamA extends TeamA {
  rank: number;
  wins: number;
  totalScore: number;
  isTied: boolean;
}

// ----------------- BẢNG B -----------------
export interface RoundScoreB {
  roundIndex: number; // 0..4 (Lượt 1 .. Lượt 5)
  tasks: number[]; // 8 tasks scores
}

export interface TeamB extends BaseTeam {
  division: 'B_EV3' | 'B_SPIKE';
  rounds: RoundScoreB[];
}

export interface RankedTeamB extends TeamB {
  rank: number;
  totalScore: number; // Sum of MAX points per task (Max 120)
  completedTasksCount: number; // Unique tasks with points > 0 (Max 8)
  maxRoundScore: number; // Highest single round score among L1..L5
  bestRoundIndices: number[]; // Indices of rounds (0..4) that match maxRoundScore (for highlighting)
  roundTotals: number[]; // Total points in each round L1..L5
  taskMaxScores: number[]; // Max points achieved for each of 8 tasks
  isTied: boolean;
}

// ----------------- BẢNG C -----------------
export interface MatchResultC {
  id: string;
  team1Id: string;
  team2Id: string;
  score1: number;
  score2: number;
  isCompleted: boolean;
  leg?: 1 | 2; // 1 = lượt đi, 2 = lượt về (undefined = lượt đi for backwards compat)
}

export interface TeamC extends BaseTeam {
  division: 'C';
}

export interface RankedTeamC extends TeamC {
  rank: number;
  matchesPlayed: number; // SỐ TRẬN
  points: number; // Win 3, Draw 1, Loss 0 (TỔNG ĐIỂM)
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number; // BÀN THẮNG
  goalsAgainst: number; // BÀN THUA
  goalDifference: number; // HIỆU SỐ
  isTied: boolean;
}

// ----------------- APP STATE -----------------
export interface AppSettings {
  title: string;
  subtitle: string;
  autoRefreshInterval: number;
  autoRankingEnabled?: boolean; // Default true (tự động xếp hạng)
  customRankColors: {
    rank1: string;
    rank2: string;
    rank3: string;
    rank4Plus: string;
  };
  allowTiedRanks: boolean;
}

export interface TimerState {
  totalSeconds: number; // e.g. 3600 for 60 mins
  remainingSeconds: number; // seconds left when paused or stopped
  targetEndTime: number | null; // Timestamp (ms) when running, null when paused
  isRunning: boolean;
  title?: string; // Custom header text
}

export interface CompetitionData {
  version?: number;
  settings: AppSettings;
  teamsA: TeamA[];
  matchesA: MatchResultA[];
  teamsB_EV3: TeamB[];
  teamsB_SPIKE: TeamB[];
  teamsC: TeamC[];
  matchesC: MatchResultC[];
  timer?: TimerState;
  lastUpdated: number;
}
