import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RankedTeamC } from '../types';

interface LeaderboardCProps {
  teams: RankedTeamC[];
  autoRankingEnabled?: boolean;
}

export const LeaderboardC: React.FC<LeaderboardCProps> = ({ teams = [], autoRankingEnabled = true }) => {
  const safeTeams = teams || [];

  const getPillClass = (team: RankedTeamC) => {
    if (autoRankingEnabled) {
      return 'rank-pill-neutral';
    }
    if (team.customMedal === 'GOLD') return 'rank-pill-1';
    if (team.customMedal === 'SILVER') return 'rank-pill-2';
    if (team.customMedal === 'BRONZE') return 'rank-pill-3';
    return 'rank-pill-neutral';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 flex flex-col flex-1 justify-start overflow-hidden">
      {/* Horizontal Scroll Wrapper for Mobile */}
      <div className="w-full overflow-x-auto pb-4 pt-1">
        <div className="min-w-[850px] md:min-w-full">
          {/* Table Header Row */}
          <div className="flex items-center text-cyan-300 font-orbitron font-extrabold text-xs sm:text-sm uppercase tracking-widest text-glow-cyan text-center py-2.5 mb-1">
            <div className="w-36 sm:w-48 text-center pl-2">ĐỘI</div>
            <div className="flex-1 text-center">SỐ TRẬN</div>
            <div className="flex-1 text-center">TỔNG ĐIỂM</div>
            <div className="flex-1 text-center">THẮNG</div>
            <div className="flex-1 text-center">HÒA</div>
            <div className="flex-1 text-center">THUA</div>
            <div className="flex-1 text-center">BÀN THẮNG</div>
            <div className="flex-1 text-center">BÀN THUA</div>
            <div className="flex-1 text-center">HIỆU SỐ</div>
          </div>

          {/* Pill Rows */}
          <div className="space-y-1.5 sm:space-y-2 lg:space-y-2.5 relative">
            <AnimatePresence mode="popLayout">
              {safeTeams.map((team) => (
                <motion.div
                  key={team.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className={`flex items-center py-1.5 sm:py-2 md:py-2.5 pill-row ${getPillClass(
                    team
                  )} text-center font-orbitron font-black text-base sm:text-lg`}
                >
                  {/* 1. Đội */}
                  <div className="w-36 sm:w-48 text-center truncate uppercase flex items-center justify-center gap-1">
                    {!autoRankingEnabled && team.customMedal === 'GOLD' && <span>🥇</span>}
                    {!autoRankingEnabled && team.customMedal === 'SILVER' && <span>🥈</span>}
                    {!autoRankingEnabled && team.customMedal === 'BRONZE' && <span>🥉</span>}
                    {team.name}
                  </div>

                  {/* 2. Số trận */}
                  <div className="flex-1 text-center">
                    {team.matchesPlayed || 0}
                  </div>

                  {/* 3. Tổng điểm */}
                  <div className="flex-1 text-center font-black text-cyan-300">
                    {team.points || 0}
                  </div>

                  {/* 4. Số trận thắng */}
                  <div className="flex-1 text-center text-emerald-400">
                    {team.wins || 0}
                  </div>

                  {/* 5. Số trận hòa */}
                  <div className="flex-1 text-center">
                    {team.draws || 0}
                  </div>

                  {/* 6. Số trận thua */}
                  <div className="flex-1 text-center text-rose-400">
                    {team.losses || 0}
                  </div>

                  {/* 7. Số bàn thắng */}
                  <div className="flex-1 text-center">
                    {team.goalsFor || 0}
                  </div>

                  {/* 8. Số bàn thua */}
                  <div className="flex-1 text-center">
                    {team.goalsAgainst || 0}
                  </div>

                  {/* 9. Hiệu số */}
                  <div className="flex-1 text-center font-black">
                    {(team.goalDifference || 0) > 0
                      ? `+${team.goalDifference}`
                      : (team.goalDifference || 0)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {safeTeams.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-orbitron text-base sm:text-lg">
                Chưa có dữ liệu đội thi đấu Bảng C
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
