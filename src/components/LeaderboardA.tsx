import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RankedTeamA } from '../types';
import { toSafeArray } from '../utils/safeArray';

interface LeaderboardAProps {
  teams: RankedTeamA[];
  autoRankingEnabled?: boolean;
}

export const LeaderboardA: React.FC<LeaderboardAProps> = ({ teams = [], autoRankingEnabled = true }) => {
  const safeTeams = toSafeArray<RankedTeamA>(teams);

  const getPillClass = (team: RankedTeamA) => {
    if (autoRankingEnabled) {
      return 'rank-pill-neutral';
    }
    if (team.customMedal === 'GOLD') return 'rank-pill-1';
    if (team.customMedal === 'SILVER') return 'rank-pill-2';
    if (team.customMedal === 'BRONZE') return 'rank-pill-3';
    return 'rank-pill-neutral';
  };

  return (
    <div className="w-full max-w-[96vw] xl:max-w-[1650px] mx-auto px-2 sm:px-6 py-1 flex flex-col flex-1 justify-start overflow-hidden">
      {/* Horizontal Scroll Wrapper for Mobile */}
      <div className="w-full overflow-x-auto pb-2 pt-1 no-scrollbar">
        <div className="min-w-[1000px] md:min-w-full">
          {/* Table Header Row */}
          <div className="flex items-center gap-2 px-6 sm:px-8 py-2 text-cyan-300 font-orbitron font-extrabold text-xs sm:text-sm uppercase tracking-widest text-glow-cyan mb-1">
            {/* Left Info Panel */}
            <div className="flex items-center shrink-0 w-[320px] sm:w-[460px]">
              <div className="w-20 sm:w-28 text-left pl-2 sm:pl-4">ĐỘI</div>
              <div className="w-20 sm:w-24 text-center">SỐ TRẬN</div>
              <div className="w-20 sm:w-28 text-center">TRẬN THẮNG</div>
              <div className="w-20 sm:w-28 text-center">TỔNG ĐIỂM</div>
            </div>
            {/* Right Matches Panel */}
            <div className="flex-1 grid grid-cols-8 gap-1 text-center">
              {['TRẬN 1', 'TRẬN 2', 'TRẬN 3', 'TRẬN 4', 'TRẬN 5', 'TRẬN 6', 'TRẬN 7', 'TRẬN 8'].map((t) => (
                <div key={t} className="text-[10px] sm:text-xs font-bold truncate">{t}</div>
              ))}
            </div>
          </div>

          {/* Pill Rows */}
          <div className="space-y-1.5 sm:space-y-2 lg:space-y-2.5 relative">
            <AnimatePresence mode="popLayout">
              {safeTeams.map((team) => {
                const scores = toSafeArray<number | null>(team.scores);
                const playedMatches = scores.filter((s) => s !== null && s !== undefined).length;
                return (
                  <motion.div
                    key={team.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 md:py-2.5 pill-row ${getPillClass(
                      team
                    )}`}
                  >
                    {/* Left Info Panel */}
                    <div className="flex items-center shrink-0 w-[320px] sm:w-[460px]">
                      {/* Team Name */}
                      <div className="w-20 sm:w-28 pl-3 sm:pl-4 flex items-center overflow-hidden">
                        <span className="font-orbitron font-black text-base sm:text-xl tracking-wider uppercase truncate flex items-center gap-1">
                          {!autoRankingEnabled && team.customMedal === 'GOLD' && <span>🥇</span>}
                          {!autoRankingEnabled && team.customMedal === 'SILVER' && <span>🥈</span>}
                          {!autoRankingEnabled && team.customMedal === 'BRONZE' && <span>🥉</span>}
                          {team.name}
                        </span>
                      </div>

                      {/* Số trận đã đấu */}
                      <div className="w-20 sm:w-24 text-center font-orbitron font-bold text-base sm:text-lg">
                        {playedMatches}
                      </div>

                      {/* Số trận thắng */}
                      <div className="w-20 sm:w-28 text-center font-orbitron font-bold text-base sm:text-lg">
                        {team.wins || 0}
                      </div>

                      {/* Total Score */}
                      <div className="w-20 sm:w-28 text-center font-orbitron font-bold text-base sm:text-lg">
                        {team.totalScore || 0}
                      </div>
                    </div>

                    {/* Match Scores TRẬN 1..8 */}
                    <div className="flex-1 grid grid-cols-8 gap-1 text-center font-orbitron font-bold text-base sm:text-lg">
                      {Array.from({ length: 8 }).map((_, idx) => {
                        const score = scores[idx];
                        return (
                          <div
                            key={idx}
                            className="bg-black/20 rounded py-1 border border-white/10"
                          >
                            {score !== null && score !== undefined ? score : '-'}
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
                Chưa có dữ liệu đội thi đấu Bảng A
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
