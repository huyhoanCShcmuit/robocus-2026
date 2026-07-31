import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RankedTeamB } from '../types';
import { toSafeArray } from '../utils/safeArray';

interface LeaderboardBProps {
  teams: RankedTeamB[];
  autoRankingEnabled?: boolean;
}

export const LeaderboardB: React.FC<LeaderboardBProps> = ({ teams = [], autoRankingEnabled = true }) => {
  const safeTeams = toSafeArray<RankedTeamB>(teams);

  const getPillClass = (team: RankedTeamB) => {
    if (autoRankingEnabled) {
      return 'rank-pill-neutral';
    }
    if (team.customMedal === 'GOLD') return 'rank-pill-1';
    if (team.customMedal === 'SILVER') return 'rank-pill-2';
    if (team.customMedal === 'BRONZE') return 'rank-pill-3';
    return 'rank-pill-neutral';
  };

  const rowSpacing = 'space-y-1.5 sm:space-y-2 lg:space-y-2.5';
  const rowPadding = 'py-1.5 sm:py-2 md:py-2.5';

  return (
    <div className="w-full max-w-[96vw] xl:max-w-[1650px] mx-auto px-2 sm:px-6 py-1 flex flex-col flex-1 justify-start overflow-hidden">
      {/* Horizontal Scroll Wrapper */}
      <div className="w-full overflow-x-auto pb-2 pt-1 no-scrollbar">
        <div className="min-w-[1000px] md:min-w-full">
          {/* Table Header Row */}
          <div className="flex items-center gap-3 px-6 sm:px-8 py-2 text-cyan-300 font-orbitron font-extrabold text-xs sm:text-sm uppercase tracking-widest text-glow-cyan mb-1">
            {/* Left Info Panel */}
            <div className="flex items-center shrink-0 w-[480px] sm:w-[660px]">
              <div className="w-24 sm:w-36 text-left pl-2 sm:pl-4">ĐỘI</div>
              <div className="w-24 sm:w-32 text-center">SỐ LƯỢT</div>
              <div className="w-24 sm:w-32 text-center">TỔNG ĐIỂM</div>
              <div className="w-28 sm:w-40 text-center">SỐ NV</div>
              <div className="w-28 sm:w-44 text-center">LƯỢT CAO NHẤT</div>
            </div>
            {/* Right Tasks Panel 1..8 */}
            <div className="flex-1 grid grid-cols-8 gap-2 text-center">
              {['NV 1', 'NV 2', 'NV 3', 'NV 4', 'NV 5', 'NV 6', 'NV 7', 'NV 8'].map((t) => (
                <div key={t} className="text-xs sm:text-sm font-bold truncate">{t}</div>
              ))}
            </div>
          </div>

          {/* Pill Rows */}
          <div className={`${rowSpacing} relative`}>
            <AnimatePresence mode="popLayout">
              {safeTeams.map((team) => {
                const rounds = toSafeArray<any>(team.rounds);
                const taskMaxScores = toSafeArray<number>(team.taskMaxScores);
                const roundsPlayed = rounds.filter((r) => toSafeArray<number>(r?.tasks).some((val) => val > 0)).length;

                return (
                  <motion.div
                    key={team.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className={`flex items-center gap-3 px-6 sm:px-8 ${rowPadding} pill-row ${getPillClass(
                      team
                    )}`}
                  >
                    {/* Left Info Panel */}
                    <div className="flex items-center shrink-0 w-[480px] sm:w-[660px]">
                      {/* 1. Đội */}
                      <div className="w-24 sm:w-36 pl-3 sm:pl-4 flex items-center overflow-hidden">
                        <span className="font-orbitron font-black text-base sm:text-xl tracking-wider uppercase truncate flex items-center gap-1">
                          {!autoRankingEnabled && team.customMedal === 'GOLD' && <span>🥇</span>}
                          {!autoRankingEnabled && team.customMedal === 'SILVER' && <span>🥈</span>}
                          {!autoRankingEnabled && team.customMedal === 'BRONZE' && <span>🥉</span>}
                          {team.name}
                        </span>
                      </div>

                      {/* 2. Số lượt thi đấu */}
                      <div className="w-24 sm:w-32 text-center font-orbitron font-bold text-base sm:text-lg">
                        {roundsPlayed}
                      </div>

                      {/* 3. Tổng Điểm */}
                      <div className="w-24 sm:w-32 text-center font-orbitron font-bold text-base sm:text-lg">
                        {team.totalScore || 0}
                      </div>

                      {/* 4. Số nhiệm vụ hoàn thành */}
                      <div className="w-28 sm:w-40 text-center font-orbitron font-bold text-base sm:text-lg">
                        {team.completedTasksCount || 0}
                      </div>

                      {/* 5. Điểm lượt cao nhất */}
                      <div className="w-28 sm:w-44 text-center font-orbitron font-bold text-base sm:text-lg">
                        {team.maxRoundScore || 0}
                      </div>
                    </div>

                    {/* 6. Nhiệm vụ 1 -> 8 */}
                    <div className="flex-1 grid grid-cols-8 gap-2 text-center font-mono font-bold text-base sm:text-lg">
                      {Array.from({ length: 8 }).map((_, idx) => {
                        const score = taskMaxScores[idx];
                        return (
                          <div
                            key={idx}
                            className="bg-black/20 rounded py-1.5 border border-white/10"
                          >
                            {score !== undefined && score > 0 ? score : '-'}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {safeTeams.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-orbitron text-base sm:text-lg">
                Chưa có dữ liệu đội thi đấu Bảng B
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
