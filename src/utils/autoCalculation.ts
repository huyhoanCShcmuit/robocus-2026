import type { TeamA, MatchResultA, TeamB, TeamC, MatchResultC } from '../types';

/**
 * Tự động tính toán thông số cho BẢNG A:
 * - Tự động tính Tổng điểm T1..T8
 * - Tự động tính Số trận THẮNG (nếu không nhập thủ công thì tự động tính từ số trận đạt điểm >= 50 hoặc thắng đối thủ)
 */
export function autoCalculateTeamA(team: TeamA, matches: MatchResultA[]) {
  const totalScore = team.scores.reduce<number>((acc, val) => acc + (val || 0), 0);

  // Auto calculate wins if not explicitly forced
  let autoWins = 0;

  // Option 1: Count explicit wins from matchesA matrix
  matches.forEach((m) => {
    if (m.winnerId === team.id) {
      autoWins += 1;
    }
  });

  // Option 2: If no matches matrix, count matches in T1..T8 where score >= 50
  if (autoWins === 0) {
    team.scores.forEach((s) => {
      if (s !== null && s >= 50) {
        autoWins += 1;
      }
    });
  }

  const finalWins = team.wins !== undefined ? team.wins : autoWins;

  return {
    ...team,
    totalScore,
    wins: finalWins,
  };
}

/**
 * Tự động tính toán thông số cho BẢNG B (EV3 & SPIKE):
 * - Tự động tìm điểm cao nhất của từng nhiệm vụ qua 5 lượt thi đấu (không cộng dồn lặp)
 * - Tự động tính Tổng điểm (tối đa 120)
 * - Tự động đếm số Nhiệm vụ đã hoàn thành (có điểm > 0, tối đa 8)
 * - Tự động xác định Lượt thi đấu có điểm số cao nhất để Highlight
 */
export function autoCalculateTeamB(team: TeamB) {
  const taskMaxScores = new Array(8).fill(0);
  const roundTotals: number[] = [];

  team.rounds.forEach((rd) => {
    let rTotal = 0;
    rd.tasks.forEach((score, taskIdx) => {
      const val = score || 0;
      rTotal += val;
      if (taskIdx < 8) {
        taskMaxScores[taskIdx] = Math.max(taskMaxScores[taskIdx], val);
      }
    });
    roundTotals.push(rTotal);
  });

  const totalScore = Math.min(120, taskMaxScores.reduce((acc, val) => acc + val, 0));
  const completedTasksCount = taskMaxScores.filter((val) => val > 0).length;
  const maxRoundScore = roundTotals.length > 0 ? Math.max(...roundTotals) : 0;

  const bestRoundIndices: number[] = [];
  roundTotals.forEach((val, idx) => {
    if (val === maxRoundScore && val > 0) {
      bestRoundIndices.push(idx);
    }
  });

  return {
    ...team,
    totalScore,
    completedTasksCount,
    maxRoundScore,
    bestRoundIndices,
    roundTotals,
    taskMaxScores,
  };
}

/**
 * Tự động tính toán thông số cho BẢNG C (Soccer 1v1):
 * - Tự động tính Số trận THẮNG (3đ), HÒA (1đ), THUA (0đ) từ tỷ số các trận đấu
 * - Tự động tính Tổng bàn thắng, Bàn thua & Hiệu số
 */
export function autoCalculateTeamC(team: TeamC, matches: MatchResultC[]) {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  matches.forEach((m) => {
    if (!m.isCompleted) return;

    if (m.team1Id === team.id) {
      goalsFor += m.score1;
      goalsAgainst += m.score2;
      if (m.score1 > m.score2) wins += 1;
      else if (m.score1 === m.score2) draws += 1;
      else losses += 1;
    } else if (m.team2Id === team.id) {
      goalsFor += m.score2;
      goalsAgainst += m.score1;
      if (m.score2 > m.score1) wins += 1;
      else if (m.score2 === m.score1) draws += 1;
      else losses += 1;
    }
  });

  const points = wins * 3 + draws * 1;
  const goalDifference = goalsFor - goalsAgainst;

  return {
    ...team,
    points,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference,
  };
}
