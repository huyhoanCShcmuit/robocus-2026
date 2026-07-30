import React, { useState, useEffect } from 'react';
import type { DivisionId } from '../types';
import { Settings, Clock, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeDivision: DivisionId;
  onSelectDivision: (div: DivisionId) => void;
  onOpenAdmin: () => void;
  isAdminOpen: boolean;
  lastUpdated: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeDivision,
  onSelectDivision,
  onOpenAdmin,
  isAdminOpen,
  lastUpdated,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getDivisionTitle = () => {
    switch (activeDivision) {
      case 'A':
        return 'BẢNG A';
      case 'B_EV3':
        return 'BẢNG B - MINDSTORMS EV3';
      case 'B_SPIKE':
        return 'BẢNG B - SPIKE PRIME';
      case 'C':
        return 'BẢNG C';
      default:
        return 'BẢNG XẾP HẠNG';
    }
  };

  return (
    <header className="w-full relative z-20 pt-4 pb-2 px-6 flex flex-col items-center">
      {/* Top Bar Controls */}
      <div className="w-full flex items-center justify-between mb-2 text-xs">
        {/* Real-time Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-cyan-500/40 px-3 py-1.5 rounded-full text-cyan-300 backdrop-blur shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold tracking-wider font-orbitron text-[11px] uppercase">REALTIME SYNC</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono text-[10px]">
            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('vi-VN') : 'Live'}
          </span>
        </div>

        {/* Division Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-cyan-500/30 backdrop-blur shadow-2xl">
          <button
            onClick={() => onSelectDivision('A')}
            className={`px-4 py-1.5 rounded-lg font-orbitron font-extrabold text-xs transition-all duration-300 ${
              activeDivision === 'A'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-105'
                : 'text-cyan-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            BẢNG A
          </button>

          <button
            onClick={() => onSelectDivision('B_EV3')}
            className={`px-4 py-1.5 rounded-lg font-orbitron font-extrabold text-xs transition-all duration-300 ${
              activeDivision === 'B_EV3'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-105'
                : 'text-cyan-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            BẢNG B - EV3
          </button>

          <button
            onClick={() => onSelectDivision('B_SPIKE')}
            className={`px-4 py-1.5 rounded-lg font-orbitron font-extrabold text-xs transition-all duration-300 ${
              activeDivision === 'B_SPIKE'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-105'
                : 'text-cyan-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            BẢNG B - SPIKE
          </button>

          <button
            onClick={() => onSelectDivision('C')}
            className={`px-4 py-1.5 rounded-lg font-orbitron font-extrabold text-xs transition-all duration-300 ${
              activeDivision === 'C'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-105'
                : 'text-cyan-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            BẢNG C
          </button>
        </div>

        {/* Right Actions: Clock & Admin Panel Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 rounded-full text-slate-300 font-mono text-xs shadow">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">{timeStr}</span>
          </div>

          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
              isAdminOpen
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.8)]'
                : 'bg-slate-800 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{isAdminOpen ? 'ĐÓNG ADMIN' : 'QUẢN LÝ / NHẬP ĐIỂM'}</span>
          </button>
        </div>
      </div>

      {/* Main Sci-Fi Leaderboard Title Banner */}
      <div className="text-center my-1 relative">
        <h1 className="text-4xl md:text-5xl font-black font-orbitron tracking-wider text-white text-glow-cyan uppercase mb-1 flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>BẢNG XẾP HẠNG</span>
          <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
        </h1>
        <div className="text-2xl md:text-3xl font-extrabold font-orbitron text-cyan-300 tracking-widest text-glow-cyan">
          {getDivisionTitle()}
        </div>
      </div>
    </header>
  );
};
