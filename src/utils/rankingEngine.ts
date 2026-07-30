import type {
  TeamA,
  MatchResultA,
  RankedTeamA,
  TeamB,
  RankedTeamB,
  TeamC,
  MatchResultC,
  RankedTeamC,
} from '../types';
import { toSafeArray } from './safeArray';

const medalOrder = { GOLD: 1, SILVER: 2, BRONZE: 3, NONE: 4 };

// ==========================================
// BẢNG A RANKING ENGINE
// ==========================================
export function calculateRankingsA(
  teams: TeamA[] = [],
  matches: MatchResultA[] = [],
  autoRankingEnabled: boolean = true
): RankedTeamA[] {
  const safeTeams = toSafeArray<TeamA>(teams);
  const safeMatches = toSafeArray<MatchResultA>(matches);

  const rankedList: RankedTeamA[] = safeTeams.map((team) => {
    // Calculate total score from T1 to T8 with safe array conversion
    const scores = toSafeArray<number | null>(team.scores);
    const totalScore = scores.reduce<number>(
      (acc, val) => acc + (val || 0),
      0
    );

    // Calculate wins counted directly from matches
    let wins = 0;
    safeMatches.forEach((m) => {
      if (m && m.winnerId === team.id) {
        wins += 1;
      }
    });

    return {
      ...team,
      rank: 0,
      wins,
      totalScore,
      isTied: false,
    };
  });

  if (autoRankingEnabled) {
    // Xếp hạng Bảng A theo tiêu chí ưu tiên:
    // 1. Số trận THẮNG (desc)
    // 2. Tổng ĐIỂM (desc)
    rankedList.sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return 0;
    });

    // Assign ranks
    let currentRank = 1;
    for (let i = 0; i < rankedList.length; i++) {
      if (i === 0) {
        rankedList[i].rank = 1;
      } else {
        const prev = rankedList[i - 1];
        const curr = rankedList[i];

        const sameWins = curr.wins === prev.wins;
        const sameScore = curr.totalScore === prev.totalScore;

        if (sameWins && sameScore) {
          curr.rank = prev.rank;
          curr.isTied = true;
          prev.isTied = true;
        } else {
          currentRank = i + 1;
          curr.rank = currentRank;
        }
      }
    }
  } else {
    // MANUAL MEDAL SORTING
    rankedList.sort((a, b) => {
      const mA = medalOrder[a.customMedal || 'NONE'];
      const mB = medalOrder[b.customMedal || 'NONE'];
      if (mA !== mB) return mA - mB;
      return 0;
    });

    for (let i = 0; i < rankedList.length; i++) {
      rankedList[i].rank = i + 1;
    }
  }

  return rankedList;
}

// ==========================================
// BẢNG B RANKING ENGINE (EV3 & SPIKE PRIME)
// ==========================================
export function calculateRankingsB(
  teams: TeamB[] = [],
  autoRankingEnabled: boolean = true
): RankedTeamB[] {
  const safeTeams = toSafeArray<TeamB>(teams);
  const rankedList: RankedTeamB[] = safeTeams.map((team) => {
    const taskMaxScores = new Array(8).fill(0);
    const roundTotals: number[] = [];

    const rounds = toSafeArray<any>(team.rounds);
    rounds.forEach((rd) => {
      let rTotal = 0;
      const tasks = toSafeArray<number>(rd?.tasks);
      tasks.forEach((score, taskIdx) => {
        const val = score || 0;
        rTotal += val;
        if (taskIdx < 8) {
          taskMaxScores[taskIdx] = Math.max(taskMaxScores[taskIdx], val);
        }
      });
      roundTotals.push(rTotal);
    });

    // Total Score = Sum of Max score achieved per task (Max 120)
    const totalScore = Math.min(
      120,
      taskMaxScores.reduce((acc, val) => acc + val, 0)
    );

    // Completed Tasks count (tasks with score > 0, Max 8)
    const completedTasksCount = taskMaxScores.filter((val) => val > 0).length;

    // Highest round score
    const maxRoundScore = roundTotals.length > 0 ? Math.max(...roundTotals) : 0;

    // Best round indices for UI highlight
    const bestRoundIndices: number[] = [];
    roundTotals.forEach((val, idx) => {
      if (val === maxRoundScore && val > 0) {
        bestRoundIndices.push(idx);
      }
    });

    return {
      ...team,
      rank: 0,
      totalScore,
      completedTasksCount,
      maxRoundScore,
      bestRoundIndices,
      roundTotals,
      taskMaxScores,
      isTied: false,
    };
  });

  if (autoRankingEnabled) {
    // Tiêu chí Auto Xếp Hạng Bảng B theo thứ tự ưu tiên:
    // 1. Tổng ĐIỂM (desc)
    // 2. Tổng số NHIỆM VỤ hoàn thành (desc)
    // 3. Lượt có ĐIỂM CAO NHẤT (desc)
    rankedList.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (b.completedTasksCount !== a.completedTasksCount) {
        return b.completedTasksCount - a.completedTasksCount;
      }
      if (b.maxRoundScore !== a.maxRoundScore) {
        return b.maxRoundScore - a.maxRoundScore;
      }
      return 0;
    });

    // Assign ranks
    let currentRank = 1;
    for (let i = 0; i < rankedList.length; i++) {
      if (i === 0) {
        rankedList[i].rank = 1;
      } else {
        const prev = rankedList[i - 1];
        const curr = rankedList[i];

        const isExactEqual =
          curr.totalScore === prev.totalScore &&
          curr.completedTasksCount === prev.completedTasksCount &&
          curr.maxRoundScore === prev.maxRoundScore;

        if (isExactEqual) {
          curr.rank = prev.rank;
          curr.isTied = true;
          prev.isTied = true;
        } else {
          currentRank = i + 1;
          curr.rank = currentRank;
        }
      }
    }
  } else {
    // MANUAL MEDAL SORTING
    rankedList.sort((a, b) => {
      const mA = medalOrder[a.customMedal || 'NONE'];
      const mB = medalOrder[b.customMedal || 'NONE'];
      if (mA !== mB) return mA - mB;
      return 0;
    });

    for (let i = 0; i < rankedList.length; i++) {
      rankedList[i].rank = i + 1;
    }
  }

  return rankedList;
}

// ==========================================
// BẢNG C RANKING ENGINE (Soccer 1v1)
// ==========================================
export function calculateRankingsC(
  teams: TeamC[] = [],
  matches: MatchResultC[] = [],
  autoRankingEnabled: boolean = true
): RankedTeamC[] {
  const safeTeams = toSafeArray<TeamC>(teams);
  const safeMatches = toSafeArray<MatchResultC>(matches);
  const rankedList: RankedTeamC[] = safeTeams.map((team) => {
    let matchesPlayed = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    safeMatches.forEach((m) => {
      if (!m || !m.isCompleted) return;

      if (m.team1Id === team.id) {
        matchesPlayed += 1;
        goalsFor += (m.score1 || 0);
        goalsAgainst += (m.score2 || 0);
        if ((m.score1 || 0) > (m.score2 || 0)) wins += 1;
        else if ((m.score1 || 0) === (m.score2 || 0)) draws += 1;
        else losses += 1;
      } else if (m.team2Id === team.id) {
        matchesPlayed += 1;
        goalsFor += (m.score2 || 0);
        goalsAgainst += (m.score1 || 0);
        if ((m.score2 || 0) > (m.score1 || 0)) wins += 1;
        else if ((m.score2 || 0) === (m.score1 || 0)) draws += 1;
        else losses += 1;
      }
    });

    const points = wins * 3 + draws * 1;
    const goalDifference = goalsFor - goalsAgainst;

    return {
      ...team,
      rank: 0,
      matchesPlayed,
      points,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference,
      isTied: false,
    };
  });

  if (autoRankingEnabled) {
    rankedList.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      if (b.draws !== a.draws) {
        return b.draws - a.draws;
      }
      if (a.losses !== b.losses) {
        return a.losses - b.losses;
      }
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      return 0;
    });

    let currentRank = 1;
    for (let i = 0; i < rankedList.length; i++) {
      if (i === 0) {
        rankedList[i].rank = 1;
      } else {
        const prev = rankedList[i - 1];
        const curr = rankedList[i];

        const isExactEqual =
          curr.points === prev.points &&
          curr.wins === prev.wins &&
          curr.draws === prev.draws &&
          curr.losses === prev.losses &&
          curr.goalDifference === prev.goalDifference;

        if (isExactEqual) {
          curr.rank = prev.rank;
          curr.isTied = true;
          prev.isTied = true;
        } else {
          currentRank = i + 1;
          curr.rank = currentRank;
        }
      }
    }
  } else {
    rankedList.sort((a, b) => {
      const mA = medalOrder[a.customMedal || 'NONE'];
      const mB = medalOrder[b.customMedal || 'NONE'];
      if (mA !== mB) return mA - mB;
      return 0;
    });

    for (let i = 0; i < rankedList.length; i++) {
      rankedList[i].rank = i + 1;
    }
  }

  return rankedList;
}
