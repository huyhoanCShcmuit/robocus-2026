import React, { useState, useEffect } from 'react';
import type { CompetitionData, TimerState } from '../types';
import { syncManager } from '../utils/syncManager';
import { Footer } from '../components/Footer';
import { Maximize, Minimize, Volume2, VolumeX, ArrowLeft, Sparkles } from 'lucide-react';

const DEFAULT_TIMER: TimerState = {
  totalSeconds: 3600,
  remainingSeconds: 3600,
  targetEndTime: null,
  isRunning: false,
  title: 'THỜI GIAN LẮP RÁP & LẬP TRÌNH ROBOT',
};

export const TimerPage: React.FC = () => {
  const [data, setData] = useState<CompetitionData>(syncManager.loadData());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Local state for smooth UI countdown rendering
  const [displaySeconds, setDisplaySeconds] = useState<number>(3600);

  const timerState: TimerState = data?.timer || DEFAULT_TIMER;

  // Listen to syncManager real-time data updates
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((freshData) => {
      if (freshData) setData(freshData);
    });
    return () => unsubscribe();
  }, []);

  // Real-time calculation of remaining seconds based on targetEndTime
  useEffect(() => {
    const updateCountdown = () => {
      if (timerState.isRunning && timerState.targetEndTime) {
        const now = Date.now();
        const diff = Math.ceil((timerState.targetEndTime - now) / 1000);
        const rem = Math.max(0, diff);
        setDisplaySeconds(rem);

        // Alert sound when reached 0
        if (rem <= 0 && timerState.isRunning) {
          playAlertSound();
        }
      } else {
        setDisplaySeconds(timerState.remainingSeconds ?? timerState.totalSeconds ?? 3600);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 200);
    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.targetEndTime, timerState.remainingSeconds, timerState.totalSeconds]);

  // Listen for fullscreen change (Esc key)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Play electronic alert chime
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playBeep = (freq: number, startOffset: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + duration);
      };

      // Play 3 alarm beeps
      playBeep(880, 0, 0.3);
      playBeep(880, 0.4, 0.3);
      playBeep(1760, 0.8, 0.6);
    } catch (e) {
      console.warn("Audio playback not allowed:", e);
    }
  };

  // Format MM:SS
  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const totalSec = timerState.totalSeconds || 3600;
  const progressPct = Math.min(100, Math.max(0, (displaySeconds / totalSec) * 100));

  // Circle SVG math
  const radius = 180;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const isFinished = displaySeconds === 0;

  return (
    <div className="min-h-screen bg-scifi-cyber text-white flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 font-sans relative overflow-hidden">
      {/* Background Cyber Accents */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Header Bar */}
      <header className="w-full relative z-20 pt-4 pb-2 px-4 sm:px-8 flex items-center justify-between">
        <a
          href="#"
          className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 px-3.5 py-1.5 rounded-full border border-cyan-500/40 backdrop-blur shadow-lg transition text-xs font-orbitron font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> BẢNG XẾP HẠNG
        </a>

        {/* Sound Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700/60 text-xs font-mono shadow transition"
            title="Bật/Tắt Âm Thanh Cảnh Báo"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </header>

      {/* Main Timer Display (Pure Display View - Only Controlled by Admin) */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-4 z-10 w-full max-w-5xl mx-auto text-center space-y-6">
        {/* Sci-Fi Title */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-orbitron tracking-wider text-white text-glow-cyan uppercase flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span>{timerState.title || 'THỜI GIAN LẮP RÁP & LẬP TRÌNH ROBOT'}</span>
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
          </h1>
          <p className="text-xs sm:text-sm font-orbitron tracking-widest text-cyan-400/80 uppercase">
            ROBOCUS 2026 — OFFICIAL COUNTDOWN TIMER
          </p>
        </div>

        {/* Circular SVG Timer & Display */}
        <div className="relative flex items-center justify-center my-4">
          <svg className="w-80 h-80 sm:w-[420px] sm:h-[420px] transform -rotate-90" viewBox="0 0 400 400">
            {/* Outer Glow Background Circle */}
            <circle
              cx="200"
              cy="200"
              r={radius}
              className="stroke-slate-900/80 fill-slate-950/80"
              strokeWidth="20"
            />
            {/* Track Circle */}
            <circle
              cx="200"
              cy="200"
              r={radius}
              className="stroke-slate-800/80 fill-none"
              strokeWidth="12"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="200"
              cy="200"
              r={radius}
              className={`fill-none transition-all duration-300 ${
                isFinished
                  ? 'stroke-rose-500'
                  : displaySeconds <= 300
                  ? 'stroke-amber-400'
                  : 'stroke-cyan-400'
              }`}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                filter: isFinished
                  ? 'drop-shadow(0 0 20px rgba(244,63,94,0.8))'
                  : displaySeconds <= 300
                  ? 'drop-shadow(0 0 20px rgba(251,191,36,0.8))'
                  : 'drop-shadow(0 0 20px rgba(6,182,212,0.8))',
              }}
            />
          </svg>

          {/* Time Digits Overlay */}
          <div className="absolute flex flex-col items-center justify-center text-center space-y-3">
            {/* Giant Digits */}
            <div
              className={`font-mono font-black text-7xl sm:text-9xl tracking-tighter ${
                isFinished
                  ? 'text-rose-400 text-glow-rose'
                  : displaySeconds <= 300
                  ? 'text-amber-300 text-glow-amber animate-pulse'
                  : 'text-cyan-300 text-glow-cyan'
              }`}
            >
              {formatTime(displaySeconds)}
            </div>

            {/* Sub text */}
            <span className="text-xs sm:text-base font-orbitron font-bold text-slate-400">
              {displaySeconds > 0 ? `CÒN LẠI / TỔNG ${Math.round(totalSec / 60)} PHÚT` : 'HOÀN THÀNH LẮP RÁP'}
            </span>
          </div>
        </div>
      </main>

      {/* Fullscreen Floating Button (z-50, position well above footer) */}
      <button
        onClick={toggleFullscreen}
        className="fixed bottom-16 sm:bottom-20 md:bottom-24 right-4 sm:right-6 z-50 bg-slate-900/90 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 p-3 rounded-full border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.6)] backdrop-blur transition-all duration-300 active:scale-95"
        title="Bật/Tắt Toàn Màn Hình Máy Chiếu"
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>

      {/* Footer */}
      <Footer />
    </div>
  );
};
