import React, { useState, useEffect, useRef } from 'react';
import type { DivisionId, CompetitionData } from '../types';
import { syncManager } from '../utils/syncManager';
import { calculateRankingsA, calculateRankingsB, calculateRankingsC } from '../utils/rankingEngine';
import { Footer } from '../components/Footer';
import { LeaderboardA } from '../components/LeaderboardA';
import { LeaderboardB } from '../components/LeaderboardB';
import { LeaderboardC } from '../components/LeaderboardC';
import { AutoFitContainer } from '../components/AutoFitContainer';
import { Sparkles, Maximize, Minimize, ShieldCheck, Timer } from 'lucide-react';

const DIVISIONS: DivisionId[] = ['A', 'B_EV3', 'B_SPIKE', 'C'];
const AUTO_SWITCH_MS = 15000; // 15 seconds

export const PublicDisplayPage: React.FC = () => {
  const [data, setData] = useState<CompetitionData>(syncManager.loadData());
  const [activeDivision, setActiveDivision] = useState<DivisionId>('A');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(AUTO_SWITCH_MS); // ms remaining
  const countdownRef = useRef<number>(AUTO_SWITCH_MS);
  const lastTickRef = useRef<number>(Date.now());
  const rotateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to real-time updates from syncManager
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((freshData) => {
      setData(freshData);
    });
    return () => unsubscribe();
  }, []);

  // Listen for native fullscreen exit (Esc key)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Auto-rotate divisions when fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      // Clear timers when exiting fullscreen
      if (rotateTimerRef.current) clearInterval(rotateTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      rotateTimerRef.current = null;
      countdownTimerRef.current = null;
      setCountdown(AUTO_SWITCH_MS);
      return;
    }

    // Reset countdown when fullscreen starts
    countdownRef.current = AUTO_SWITCH_MS;
    lastTickRef.current = Date.now();
    setCountdown(AUTO_SWITCH_MS);

    // Rotate division every AUTO_SWITCH_MS
    rotateTimerRef.current = setInterval(() => {
      setActiveDivision((prev) => {
        const idx = DIVISIONS.indexOf(prev);
        return DIVISIONS[(idx + 1) % DIVISIONS.length];
      });
      countdownRef.current = AUTO_SWITCH_MS;
      lastTickRef.current = Date.now();
      setCountdown(AUTO_SWITCH_MS);
    }, AUTO_SWITCH_MS);

    // Smooth countdown every 100ms
    countdownTimerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      const remaining = Math.max(0, AUTO_SWITCH_MS - elapsed);
      setCountdown(remaining);
    }, 100);

    return () => {
      if (rotateTimerRef.current) clearInterval(rotateTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isFullscreen]);

  // Manual tab change resets the countdown too
  const handleDivisionChange = (div: DivisionId) => {
    setActiveDivision(div);
    if (isFullscreen) {
      countdownRef.current = AUTO_SWITCH_MS;
      lastTickRef.current = Date.now();
      setCountdown(AUTO_SWITCH_MS);
      // Restart rotate timer so it counts 15s from now
      if (rotateTimerRef.current) clearInterval(rotateTimerRef.current);
      rotateTimerRef.current = setInterval(() => {
        setActiveDivision((prev) => {
          const idx = DIVISIONS.indexOf(prev);
          return DIVISIONS[(idx + 1) % DIVISIONS.length];
        });
        countdownRef.current = AUTO_SWITCH_MS;
        lastTickRef.current = Date.now();
        setCountdown(AUTO_SWITCH_MS);
      }, AUTO_SWITCH_MS);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const autoRankingEnabled = data.settings?.autoRankingEnabled ?? true;

  // Calculate Rankings
  const rankedA = calculateRankingsA(data.teamsA, data.matchesA, autoRankingEnabled);
  const rankedB_EV3 = calculateRankingsB(data.teamsB_EV3, autoRankingEnabled);
  const rankedB_SPIKE = calculateRankingsB(data.teamsB_SPIKE, autoRankingEnabled);
  const rankedC = calculateRankingsC(data.teamsC, data.matchesC, autoRankingEnabled);

  const getDivisionTitle = () => {
    switch (activeDivision) {
      case 'A': return 'BẢNG A';
      case 'B_EV3': return 'BẢNG B - MINDSTORMS EV3';
      case 'B_SPIKE': return 'BẢNG B - SPIKE PRIME';
      case 'C': return 'BẢNG C';
      default: return 'BẢNG XẾP HẠNG';
    }
  };

  const progressPct = (countdown / AUTO_SWITCH_MS) * 100;

  return (
    <div className="h-screen max-h-screen bg-scifi-cyber text-white flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 font-sans relative overflow-hidden">
      {/* Background Cyber Accents */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Auto-rotate Progress Bar (only in fullscreen) */}
      {isFullscreen && (
        <div className="fixed top-0 left-0 w-full z-50 h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-none"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Header Bar */}
      <header className="w-full relative z-20 pt-2 sm:pt-3 pb-1 px-3 sm:px-6 flex flex-col items-center shrink-0">
        <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-1 text-xs">
          {/* Realtime Live Indicator */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-cyan-500/40 px-3 py-1 rounded-full text-cyan-300 backdrop-blur shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold tracking-wider font-orbitron text-[10px] sm:text-[11px] uppercase">STAGE DISPLAY - LIVE SYNC</span>
          </div>

          {/* Division Selector Tabs - Scrollable on mobile */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-cyan-500/30 backdrop-blur shadow-2xl overflow-x-auto max-w-full no-scrollbar">
            {[
              { id: 'A', label: 'BẢNG A' },
              { id: 'B_EV3', label: 'BẢNG B - EV3' },
              { id: 'B_SPIKE', label: 'BẢNG B - SPIKE' },
              { id: 'C', label: 'BẢNG C' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleDivisionChange(tab.id as DivisionId)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg font-orbitron font-extrabold text-xs whitespace-nowrap transition-all duration-300 ${
                  activeDivision === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-105'
                    : 'text-cyan-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Single 60p Timer Link & Admin Link */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#time"
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 text-xs font-orbitron font-extrabold px-3 sm:px-4 py-1.5 rounded-full border border-amber-500/40 transition shadow"
              title="Đếm ngược 60 phút lắp ráp & lập trình robot"
            >
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span>TIMER 60P</span>
            </a>

            <a
              href="#admin"
              className="flex items-center gap-1 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 text-[10px] font-mono px-2.5 py-1 rounded-full border border-slate-800 transition"
              title="Cổng nhập điểm bảo mật dành cho Trọng tài"
            >
              <ShieldCheck className="w-3 h-3 text-cyan-500" />
              <span className="hidden sm:inline">Referees Portal</span>
              <span className="sm:hidden">Admin</span>
            </a>
          </div>
        </div>

        {/* Sci-Fi Title Banner */}
        <div className="text-center my-1 relative">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black font-orbitron tracking-wider text-white text-glow-cyan uppercase mb-0.5 flex items-center justify-center gap-2 sm:gap-3">
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>BẢNG XẾP HẠNG</span>
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          </h1>
          <div className="text-base sm:text-xl md:text-2xl font-extrabold font-orbitron text-cyan-300 tracking-widest text-glow-cyan">
            {getDivisionTitle()}
          </div>
        </div>
      </header>

      {/* Main Leaderboard Table Display Auto-Scaled */}
      <main className="flex-1 min-h-0 flex flex-col justify-center items-center z-10 w-full overflow-hidden px-1">
        <AutoFitContainer>
          {activeDivision === 'A' && <LeaderboardA teams={rankedA} autoRankingEnabled={autoRankingEnabled} />}
          {activeDivision === 'B_EV3' && <LeaderboardB teams={rankedB_EV3} autoRankingEnabled={autoRankingEnabled} />}
          {activeDivision === 'B_SPIKE' && <LeaderboardB teams={rankedB_SPIKE} autoRankingEnabled={autoRankingEnabled} />}
          {activeDivision === 'C' && <LeaderboardC teams={rankedC} autoRankingEnabled={autoRankingEnabled} />}
        </AutoFitContainer>
      </main>



      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="fixed bottom-14 sm:bottom-16 right-4 sm:right-6 z-30 bg-slate-900/80 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 p-2.5 sm:p-3 rounded-full border border-cyan-500/50 shadow-2xl backdrop-blur transition-all duration-300"
        title="Bật/Tắt Toàn Màn Hình Máy Chiếu"
      >
        {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
      </button>

      {/* Footer */}
      <Footer />
    </div>
  );
};
