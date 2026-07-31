import React, { useState, useEffect } from 'react';
import type { CompetitionData, TimerState } from '../types';
import { syncManager } from '../utils/syncManager';
import { Footer } from '../components/Footer';
import { Play, Pause, RotateCcw, Plus, Minus, Maximize, Minimize, Volume2, VolumeX, ArrowLeft, Clock, Sparkles } from 'lucide-react';

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
  const [timeStr, setTimeStr] = useState<string>('');

  // Local state for smooth 100ms UI countdown rendering
  const [displaySeconds, setDisplaySeconds] = useState<number>(3600);

  const timerState: TimerState = data?.timer || DEFAULT_TIMER;

  // Listen to syncManager data updates
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

        // Auto stop when reached 0
        if (rem <= 0 && timerState.isRunning) {
          handlePause(0);
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

  // Current clock time
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Helper to commit updated timer state
  const commitTimer = (newTimer: TimerState) => {
    const updated: CompetitionData = {
      ...data,
      timer: newTimer,
    };
    setData(updated);
    syncManager.saveData(updated);
  };

  // Timer Actions
  const handleStart = () => {
    const currentRem = displaySeconds > 0 ? displaySeconds : timerState.totalSeconds;
    const targetEndTime = Date.now() + currentRem * 1000;
    commitTimer({
      ...timerState,
      remainingSeconds: currentRem,
      targetEndTime,
      isRunning: true,
    });
  };

  const handlePause = (forcedRem?: number) => {
    const rem = forcedRem !== undefined ? forcedRem : displaySeconds;
    commitTimer({
      ...timerState,
      remainingSeconds: rem,
      targetEndTime: null,
      isRunning: false,
    });
  };

  const handleReset = (seconds: number = 3600) => {
    commitTimer({
      ...timerState,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      targetEndTime: null,
      isRunning: false,
    });
    setDisplaySeconds(seconds);
  };

  const handleAdjustTime = (deltaSeconds: number) => {
    const newRem = Math.max(0, displaySeconds + deltaSeconds);
    const newTotal = Math.max(newRem, timerState.totalSeconds);
    
    if (timerState.isRunning) {
      const targetEndTime = Date.now() + newRem * 1000;
      commitTimer({
        ...timerState,
        totalSeconds: newTotal,
        remainingSeconds: newRem,
        targetEndTime,
      });
    } else {
      commitTimer({
        ...timerState,
        totalSeconds: newTotal,
        remainingSeconds: newRem,
        targetEndTime: null,
      });
    }
    setDisplaySeconds(newRem);
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

        {/* Realtime Live Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-cyan-500/40 px-4 py-1.5 rounded-full text-cyan-300 backdrop-blur shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="font-bold tracking-wider font-orbitron text-xs uppercase">ROBOCUS 2026 - TIMER LIVE</span>
        </div>

        {/* Clock & Sound Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700/60 text-xs font-mono shadow transition"
            title="Bật/Tắt Âm Thanh Cảnh Báo"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/60 px-3.5 py-1.5 rounded-full text-slate-300 font-mono text-xs shadow">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">{timeStr}</span>
          </div>
        </div>
      </header>

      {/* Main Timer Body */}
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
          <svg className="w-72 h-72 sm:w-96 sm:h-96 transform -rotate-90" viewBox="0 0 400 400">
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
                  ? 'drop-shadow(0 0 15px rgba(244,63,94,0.8))'
                  : displaySeconds <= 300
                  ? 'drop-shadow(0 0 15px rgba(251,191,36,0.8))'
                  : 'drop-shadow(0 0 15px rgba(6,182,212,0.8))',
              }}
            />
          </svg>

          {/* Time Digits Overlay */}
          <div className="absolute flex flex-col items-center justify-center text-center space-y-2">
            {/* Status Badge */}
            <span
              className={`px-3.5 py-1 rounded-full font-orbitron font-black text-[10px] sm:text-xs tracking-widest uppercase border shadow-lg ${
                isFinished
                  ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 animate-bounce'
                  : timerState.isRunning
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 animate-pulse'
                  : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
              }`}
            >
              {isFinished ? '🔴 HẾT GIỜ THI ĐẤU' : timerState.isRunning ? '🟢 ĐANG CHẠY' : '🟡 TẠM DỪNG'}
            </span>

            {/* Giant Digits */}
            <div
              className={`font-mono font-black text-6xl sm:text-8xl tracking-tighter ${
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
            <span className="text-xs sm:text-sm font-orbitron font-bold text-slate-400">
              {displaySeconds > 0 ? `CÒN LẠI / TỔNG ${Math.round(totalSec / 60)} PHÚT` : 'HOÀN THÀNH LẮP RÁP'}
            </span>
          </div>
        </div>

        {/* Control Buttons & Quick Presets */}
        <div className="space-y-4 max-w-2xl w-full bg-slate-900/90 p-4 sm:p-6 rounded-3xl border border-cyan-500/30 backdrop-blur shadow-2xl">
          {/* Main Action Buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {!timerState.isRunning ? (
              <button
                onClick={handleStart}
                disabled={isFinished}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-black text-sm sm:text-base px-6 py-3 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.6)] active:scale-95 transition disabled:opacity-50"
              >
                <Play className="w-5 h-5 fill-current" /> BẮT ĐẦU
              </button>
            ) : (
              <button
                onClick={() => handlePause()}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-orbitron font-black text-sm sm:text-base px-6 py-3 rounded-2xl shadow-[0_0_25px_rgba(251,191,36,0.6)] active:scale-95 transition"
              >
                <Pause className="w-5 h-5 fill-current" /> TẠM DỪNG
              </button>
            )}

            <button
              onClick={() => handleReset(3600)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-orbitron font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-cyan-500/40 active:scale-95 transition"
            >
              <RotateCcw className="w-4 h-4" /> RESET 60 PHÚT
            </button>

            {/* Fine adjustment +1m / -1m */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => handleAdjustTime(-60)}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-rose-400 rounded-xl transition"
                title="-1 Phút"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-400 px-1">1p</span>
              <button
                onClick={() => handleAdjustTime(60)}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl transition"
                title="+1 Phút"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-2 border-t border-slate-800">
            <span className="text-[10px] font-orbitron text-slate-400 uppercase font-bold mr-1">
              CHỌN NHANH:
            </span>
            {[
              { label: '60 Phút', sec: 3600 },
              { label: '45 Phút', sec: 2700 },
              { label: '30 Phút', sec: 1800 },
              { label: '15 Phút', sec: 900 },
              { label: '5 Phút', sec: 300 },
            ].map((p) => (
              <button
                key={p.sec}
                onClick={() => handleReset(p.sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-orbitron font-extrabold transition ${
                  totalSec === p.sec
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Fullscreen Floating Button */}
      <button
        onClick={toggleFullscreen}
        className="fixed bottom-14 sm:bottom-16 right-4 sm:right-6 z-30 bg-slate-900/90 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 p-3 rounded-full border border-cyan-500/50 shadow-2xl backdrop-blur transition-all duration-300"
        title="Bật/Tắt Toàn Màn Hình Máy Chiếu"
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>

      {/* Footer */}
      <Footer />
    </div>
  );
};
