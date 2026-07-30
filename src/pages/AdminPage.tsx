import React, { useState, useEffect } from 'react';
import type { CompetitionData, TeamA, TeamB, TeamC } from '../types';
import { syncManager } from '../utils/syncManager';
import { calculateRankingsB } from '../utils/rankingEngine';
import { Trophy, Lock, Key, Plus, Trash2, Download, Upload, RefreshCw, CheckCircle, ExternalLink, Zap, ArrowLeft } from 'lucide-react';

const DEFAULT_PIN = '2026';

export const AdminPage: React.FC = () => {
  const [data, setData] = useState<CompetitionData>(syncManager.loadData());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('robocus_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'A' | 'B_EV3' | 'B_SPIKE' | 'C' | 'TEAMS'>('A');
  const [formData, setFormData] = useState<CompetitionData>(JSON.parse(JSON.stringify(data)));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDivision, setNewTeamDivision] = useState<'A' | 'B_EV3' | 'B_SPIKE' | 'C'>('A');

  // Bảng A Selected Pair State (2 Dropdowns)
  const [selectedTeam1Id, setSelectedTeam1Id] = useState<string>(
    () => (syncManager.loadData()?.teamsA?.[0]?.id || '')
  );
  const [selectedTeam2Id, setSelectedTeam2Id] = useState<string>(
    () => (syncManager.loadData()?.teamsA?.[1]?.id || '')
  );

  useEffect(() => {
    const teams = formData?.teamsA || [];
    if (teams.length >= 2) {
      if (!selectedTeam1Id || !teams.some((t) => t.id === selectedTeam1Id)) {
        setSelectedTeam1Id(teams[0].id);
      }
      if (!selectedTeam2Id || !teams.some((t) => t.id === selectedTeam2Id)) {
        setSelectedTeam2Id(teams[1].id);
      }
    }
  }, [formData?.teamsA]);

  // Subscribe to real-time data
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((freshData) => {
      if (freshData) {
        setData(freshData);
        setFormData(JSON.parse(JSON.stringify(freshData)));
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle PIN authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_PIN) {
      sessionStorage.setItem('robocus_admin_auth', 'true');
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Helper to commit changes immediately (Instant Real-time Auto Rerank)
  const commitData = (newData: CompetitionData) => {
    setFormData(newData);
    setData(newData);
    syncManager.saveData(newData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const autoRankingEnabled = formData.settings?.autoRankingEnabled ?? true;

  const handleToggleAutoRanking = () => {
    const updated: CompetitionData = {
      ...formData,
      settings: {
        ...formData.settings,
        autoRankingEnabled: !autoRankingEnabled,
      },
    };
    commitData(updated);
  };

  const handleSetTeamMedal = (teamId: string, division: 'A' | 'B_EV3' | 'B_SPIKE' | 'C', medal: 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE') => {
    const updated = { ...formData };
    const updateTeamList = (list: any[]) =>
      list.map((t) => (t.id === teamId ? { ...t, customMedal: medal === 'NONE' ? undefined : medal } : t));

    if (division === 'A') updated.teamsA = updateTeamList(updated.teamsA);
    else if (division === 'B_EV3') updated.teamsB_EV3 = updateTeamList(updated.teamsB_EV3);
    else if (division === 'B_SPIKE') updated.teamsB_SPIKE = updateTeamList(updated.teamsB_SPIKE);
    else if (division === 'C') updated.teamsC = updateTeamList(updated.teamsC);

    commitData(updated);
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robocus2026_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        commitData(imported);
        alert('Đã nhập dữ liệu thành công!');
      } catch (err) {
        alert('File JSON không hợp lệ!');
      }
    };
    reader.readAsText(file);
  };

  // Add Team
  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;
    const id = `team_${Date.now()}`;
    const name = newTeamName.trim().toUpperCase();
    const updated = { ...formData };

    if (newTeamDivision === 'A') {
      const newTeam: TeamA = { id, name, division: 'A', wins: 0, scores: new Array(8).fill(null) };
      updated.teamsA = [...updated.teamsA, newTeam];
    } else if (newTeamDivision === 'B_EV3' || newTeamDivision === 'B_SPIKE') {
      const newTeam: TeamB = {
        id,
        name,
        division: newTeamDivision,
        rounds: Array.from({ length: 5 }).map((_, idx) => ({ roundIndex: idx, tasks: new Array(8).fill(0) })),
      };
      if (newTeamDivision === 'B_EV3') {
        updated.teamsB_EV3 = [...updated.teamsB_EV3, newTeam];
      } else {
        updated.teamsB_SPIKE = [...updated.teamsB_SPIKE, newTeam];
      }
    } else if (newTeamDivision === 'C') {
      const newTeam: TeamC = { id, name, division: 'C' };
      updated.teamsC = [...updated.teamsC, newTeam];
    }

    commitData(updated);
    setNewTeamName('');
  };

  // Delete Team
  const handleDeleteTeam = (id: string, div: 'A' | 'B_EV3' | 'B_SPIKE' | 'C') => {
    if (!confirm('Bạn có chắc chắn muốn xóa đội này?')) return;
    const updated = { ...formData };
    if (div === 'A') {
      updated.teamsA = updated.teamsA.filter((t) => t.id !== id);
    } else if (div === 'B_EV3') {
      updated.teamsB_EV3 = updated.teamsB_EV3.filter((t) => t.id !== id);
    } else if (div === 'B_SPIKE') {
      updated.teamsB_SPIKE = updated.teamsB_SPIKE.filter((t) => t.id !== id);
    } else if (div === 'C') {
      updated.teamsC = updated.teamsC.filter((t) => t.id !== id);
    }
    commitData(updated);
  };

  // Handle Match Pairing Score Change for Bảng A (36 Round Robin Matches)
  const handlePairScoreChangeA = (matchId: string, team1Id: string, team2Id: string, val1: string, val2: string) => {
    const s1 = val1 === '' ? null : Math.min(100, Math.max(0, parseInt(val1) || 0));
    const s2 = val2 === '' ? null : Math.min(100, Math.max(0, parseInt(val2) || 0));

    const teamsA = (formData?.teamsA || []).filter(Boolean);
    const matchesA = (formData?.matchesA || []).filter(Boolean);

    // 1. Update match scores in matchesA (preserve manual winnerId if set)
    const updatedMatchesA = matchesA.map((m) => {
      if (!m) return m;
      if (m.id === matchId) {
        return { ...m, score1: s1, score2: s2 };
      }
      return m;
    });

    // 2. Find indices i and j of team1 and team2 in teamsA
    const i = teamsA.findIndex((t) => t && t.id === team1Id);
    const j = teamsA.findIndex((t) => t && t.id === team2Id);

    if (i === -1 || j === -1) return;

    const slot1 = j > i ? j - 1 : j;
    const slot2 = i > j ? i - 1 : i;

    // 3. Update team.scores for team1 and team2
    let updatedTeamsA = teamsA.map((t, idx) => {
      if (!t) return t;
      if (idx === i) {
        const newScores = [...(t.scores || new Array(8).fill(null))];
        if (slot1 >= 0 && slot1 < 8) newScores[slot1] = s1;
        return { ...t, scores: newScores };
      }
      if (idx === j) {
        const newScores = [...(t.scores || new Array(8).fill(null))];
        if (slot2 >= 0 && slot2 < 8) newScores[slot2] = s2;
        return { ...t, scores: newScores };
      }
      return t;
    });

    // 4. Recalculate wins for all teams based on manual winnerId selection
    const winsMap: Record<string, number> = {};
    updatedTeamsA.forEach((t) => { if (t && t.id) winsMap[t.id] = 0; });
    updatedMatchesA.forEach((m) => {
      if (m && m.winnerId && winsMap[m.winnerId] !== undefined) {
        winsMap[m.winnerId] += 1;
      }
    });

    updatedTeamsA = updatedTeamsA.map((t) => {
      if (!t) return t;
      return {
        ...t,
        wins: winsMap[t.id] !== undefined ? winsMap[t.id] : (t.wins || 0),
      };
    });

    commitData({
      ...formData,
      matchesA: updatedMatchesA,
      teamsA: updatedTeamsA,
    });
  };

  // Handle Manual Winner Selection by Referee
  const handleManualWinnerChangeA = (matchId: string, selectedWinnerId: string | null) => {
    const teamsA = (formData?.teamsA || []).filter(Boolean);
    const matchesA = (formData?.matchesA || []).filter(Boolean);

    const updatedMatchesA = matchesA.map((m) => {
      if (!m) return m;
      if (m.id === matchId) {
        // Toggle off if already selected, otherwise set to selectedWinnerId
        const newWinnerId = m.winnerId === selectedWinnerId ? null : selectedWinnerId;
        return { ...m, winnerId: newWinnerId };
      }
      return m;
    });

    // Recalculate wins for all teams in Bảng A based on manual winner selection
    const winsMap: Record<string, number> = {};
    teamsA.forEach((t) => { if (t && t.id) winsMap[t.id] = 0; });
    updatedMatchesA.forEach((m) => {
      if (m && m.winnerId && winsMap[m.winnerId] !== undefined) {
        winsMap[m.winnerId] += 1;
      }
    });

    const updatedTeamsA = teamsA.map((t) => {
      if (!t) return t;
      return {
        ...t,
        wins: winsMap[t.id] !== undefined ? winsMap[t.id] : (t.wins || 0),
      };
    });

    commitData({
      ...formData,
      matchesA: updatedMatchesA,
      teamsA: updatedTeamsA,
    });
  };

  // Handle Task Score Input Bảng B
  const handleTaskScoreChangeB = (
    div: 'B_EV3' | 'B_SPIKE',
    teamId: string,
    roundIdx: number,
    taskIdx: number,
    val: string
  ) => {
    const num = Math.max(0, parseInt(val) || 0);
    const key = div === 'B_EV3' ? 'teamsB_EV3' : 'teamsB_SPIKE';
    const currentTeams = formData?.[key] || [];

    const updated: CompetitionData = {
      ...formData,
      [key]: currentTeams.map((t) => {
        if (t.id === teamId) {
          const newRounds = (t.rounds || []).map((rd) => {
            if (rd.roundIndex === roundIdx) {
              const newTasks = [...(rd.tasks || new Array(8).fill(0))];
              newTasks[taskIdx] = num;
              return { ...rd, tasks: newTasks };
            }
            return rd;
          });
          return { ...t, rounds: newRounds };
        }
        return t;
      }),
    };
    commitData(updated);
  };

  // Calculate live preview rankings inside Admin Portal
  const liveRankedB_EV3 = calculateRankingsB(formData.teamsB_EV3);
  const liveRankedB_SPIKE = calculateRankingsB(formData.teamsB_SPIKE);

  const getRankPreview = (teamId: string, rankedList: { id: string; rank: number }[]) => {
    const item = rankedList.find((r) => r.id === teamId);
    return item ? item.rank : '-';
  };

  // PIN SECURITY LOGIN VIEW
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.2)] text-center space-y-5 sm:space-y-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto border border-cyan-500/40">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black font-orbitron text-white tracking-wider">CỔNG BẢO MẬT TRỌNG TÀI</h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">ROBOCUS 2026 - Score Entry Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <Key className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="Nhập mã PIN (Mặc định: 2026)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-white pl-10 pr-4 py-2.5 rounded-xl font-mono text-center text-lg focus:outline-none"
                />
              </div>
              {pinError && <p className="text-rose-400 text-xs font-bold mt-2">Mã PIN không đúng! Vui lòng thử lại.</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron font-extrabold py-3 rounded-xl shadow-lg transition active:scale-95"
            >
              XÁC NHẬN TRUY CẬP
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800">
            <a href="#" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300">
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Màn hình Sân khấu
            </a>
          </div>
        </div>
      </div>
    );
  }

  // DEDICATED ADMIN DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-[#02081f] text-white flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-[#040d2d] border-b border-cyan-500/40 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 shadow-xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
          <div>
            <h1 className="font-orbitron font-extrabold text-sm sm:text-lg text-white tracking-wider leading-tight">
              ROBOCUS 2026 - SCORING
            </h1>
            <div className="text-[9px] sm:text-[10px] text-cyan-400 font-mono">CỔNG NHẬP ĐIỂM BẢO MẬT</div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="flex items-center gap-1 sm:gap-1.5 text-cyan-300 text-[10px] sm:text-xs font-bold bg-cyan-950/80 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-cyan-500/40 animate-pulse">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
            <span className="hidden sm:inline">REALTIME SYNC</span>
            <span className="sm:hidden">LIVE</span>
          </span>

          {saveSuccess && (
            <span className="flex items-center gap-1 text-emerald-400 text-[10px] sm:text-xs font-bold bg-emerald-950/80 px-2.5 sm:px-3 py-1 rounded-full border border-emerald-500/40">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> OK!
            </span>
          )}

          <button
            onClick={handleToggleAutoRanking}
            className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-orbitron font-extrabold px-3 py-1.5 rounded-full border transition ${
              autoRankingEnabled
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900'
                : 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg font-black scale-105'
            }`}
            title="Bật/tắt xếp hạng tự động real-time"
          >
            {autoRankingEnabled ? '⚡ AUTO XẾP HẠNG: BẬT' : '🔒 AUTO XẾP HẠNG: TẮT (GÁN HUY CHƯƠNG MANUALLY)'}
          </button>

          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 sm:gap-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-cyan-500/50 transition"
          >
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">MỞ MÀN HÌNH SÂN KHẤU</span>
            <span className="sm:hidden">SÂN KHẤU</span>
          </a>

          <button
            onClick={() => {
              sessionStorage.removeItem('robocus_admin_auth');
              setIsAuthenticated(false);
            }}
            className="text-[10px] sm:text-xs text-rose-400 hover:text-rose-300 bg-rose-950/60 border border-rose-500/30 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold"
          >
            ĐĂNG XUẤT
          </button>
        </div>
      </header>

      {/* Main Console Content */}
      <div className="flex-1 flex flex-col p-3 sm:p-6 space-y-3 sm:space-y-4 max-w-7xl w-full mx-auto">
        {/* Navigation Tabs & Actions */}
        <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 sm:gap-3 shadow-xl">
          {/* Tabs - Pill badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {[
              { id: 'A', label: 'BẢNG A', shortLabel: 'A' },
              { id: 'B_EV3', label: 'B (EV3)', shortLabel: 'EV3' },
              { id: 'B_SPIKE', label: 'B (SPIKE)', shortLabel: 'SPIKE' },
              { id: 'C', label: 'BẢNG C', shortLabel: 'C' },
              { id: 'TEAMS', label: 'QUẢN LÝ ĐỘI', shortLabel: 'ĐỘI' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 font-orbitron text-[10px] sm:text-xs font-extrabold rounded-full transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] sm:text-xs px-3 py-1.5 rounded-full font-bold border border-cyan-500/30 transition"
            >
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> EXPORT
            </button>

            <label className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] sm:text-xs px-3 py-1.5 rounded-full font-bold border border-cyan-500/30 cursor-pointer transition">
              <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> IMPORT
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn XÓA SẠCH toàn bộ dữ liệu để bắt đầu giải đấu mới?')) {
                  const res = syncManager.clearAllData();
                  commitData(res);
                }
              }}
              className="flex items-center gap-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-[10px] sm:text-xs px-3 py-1.5 rounded-full font-bold border border-rose-500/40 transition"
              title="Xóa toàn bộ đội thi & điểm số về trạng thái trống"
            >
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> RESET
            </button>
          </div>
        </div>

        {/* Tab Sections Container */}
        <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-3 sm:p-6 overflow-y-auto shadow-2xl">
          {/* BẢNG A */}
          {activeTab === 'A' && (
            <div className="space-y-5">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div>
                  <h3 className="text-cyan-400 font-orbitron font-extrabold text-sm sm:text-base">
                    NHẬP ĐIỂM BẢNG A — CHỌN CẶP ĐẤU (2 DROPDOWNS)
                  </h3>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                    Chọn 2 đội thi đấu để hiển thị duy nhất 1 trận đấu tương ứng, thao tác nhanh & cực kỳ gọn gàng.
                  </span>
                </div>
              </div>

              {(formData?.teamsA || []).length < 2 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <p className="text-sm sm:text-base font-orbitron">Bảng A cần ít nhất 2 đội để thi đấu.</p>
                  <button
                    onClick={() => setActiveTab('TEAMS')}
                    className="bg-cyan-500 text-slate-950 font-orbitron font-bold text-xs px-4 py-2 rounded-full"
                  >
                    THÊM ĐỘI BẢNG A NGAY
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 2 DROPDOWNS SELECTION PANEL */}
                  <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
                    <div className="text-xs font-orbitron font-extrabold text-cyan-300 uppercase tracking-wider">
                      CHỌN CẶP ĐẤU THI ĐẤU
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Dropdown 1: Đội 1 */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                          ĐỘI THỨ NHẤT (TEAM 1):
                        </label>
                        <select
                          value={selectedTeam1Id}
                          onChange={(e) => setSelectedTeam1Id(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-white font-orbitron font-black text-sm rounded-xl px-3.5 py-2.5 focus:border-cyan-400 focus:outline-none"
                        >
                          {(formData?.teamsA || []).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Dropdown 2: Đội 2 */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                          ĐỘI THỨ HAI (TEAM 2):
                        </label>
                        <select
                          value={selectedTeam2Id}
                          onChange={(e) => setSelectedTeam2Id(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-white font-orbitron font-black text-sm rounded-xl px-3.5 py-2.5 focus:border-cyan-400 focus:outline-none"
                        >
                          {(formData?.teamsA || []).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quick Match Selector Dropdown */}
                    <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">Hoặc chọn nhanh từ danh sách 36 trận:</span>
                      <select
                        onChange={(e) => {
                          const mId = e.target.value;
                          const match = (formData?.matchesA || []).find((m) => m.id === mId);
                          if (match) {
                            setSelectedTeam1Id(match.team1Id);
                            setSelectedTeam2Id(match.team2Id);
                          }
                        }}
                        className="w-full sm:w-auto bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none flex-1"
                      >
                        <option value="">-- Danh sách 36 Trận Đấu Vòng Tròn --</option>
                        {(formData?.matchesA || []).map((m, idx) => {
                          const t1 = (formData?.teamsA || []).find((t) => t.id === m.team1Id);
                          const t2 = (formData?.teamsA || []).find((t) => t.id === m.team2Id);
                          return (
                            <option key={m.id} value={m.id}>
                              Trận #{idx + 1}: {t1?.name || m.team1Id} vs {t2?.name || m.team2Id} {m.winnerId ? '🏆' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* DISPLAY SINGLE MATCH RECORD */}
                  {!selectedTeam1Id || !selectedTeam2Id || selectedTeam1Id === selectedTeam2Id ? (
                    <div className="bg-amber-950/60 border border-amber-500/40 p-4 rounded-xl text-center text-amber-300 font-orbitron text-xs sm:text-sm">
                      ⚠️ Vui lòng chọn 2 đội thi đấu khác nhau để nhập điểm.
                    </div>
                  ) : (() => {
                    const match = (formData?.matchesA || []).find(
                      (m) =>
                        (m.team1Id === selectedTeam1Id && m.team2Id === selectedTeam2Id) ||
                        (m.team1Id === selectedTeam2Id && m.team2Id === selectedTeam1Id)
                    );

                    if (!match) {
                      return (
                        <div className="bg-slate-950 p-4 rounded-xl text-center text-slate-400 font-orbitron text-xs sm:text-sm">
                          Không tìm thấy trận đấu giữa 2 đội này.
                        </div>
                      );
                    }

                    const t1 = (formData?.teamsA || []).find((t) => t.id === match.team1Id);
                    const t2 = (formData?.teamsA || []).find((t) => t.id === match.team2Id);

                    const isT1Winner = match.winnerId === match.team1Id;
                    const isT2Winner = match.winnerId === match.team2Id;

                    return (
                      <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-cyan-500/40 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between text-xs font-mono text-cyan-400 border-b border-slate-900 pb-2.5">
                          <span className="font-bold uppercase tracking-wider font-orbitron">KẾT QUẢ CẶP ĐẤU</span>
                          <span className="bg-cyan-950 px-3 py-1 rounded-full border border-cyan-500/40 font-bold">
                            {t1?.name} VS {t2?.name}
                          </span>
                        </div>

                        {/* Perfectly Responsive Match Record Capsule */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800">
                          {/* Team 1 Side */}
                          <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-1/3">
                            <span className="font-orbitron font-black text-xl sm:text-2xl text-amber-300 truncate">
                              {t1?.name}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleManualWinnerChangeA(match.id, match.team1Id)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-orbitron font-extrabold transition shrink-0 ${
                                isT1Winner
                                  ? 'bg-amber-400 text-slate-950 border border-amber-300 shadow-md font-black scale-105'
                                  : 'bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-700 font-bold'
                              }`}
                            >
                              {isT1Winner ? '🏆 THẮNG' : '⚪ Chọn Thắng'}
                            </button>
                          </div>

                          {/* Center Scores & VS Badge */}
                          <div className="flex items-center gap-3 shrink-0 my-1 md:my-0">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={match.score1 !== null && match.score1 !== undefined ? match.score1 : ''}
                              onChange={(e) =>
                                handlePairScoreChangeA(
                                  match.id,
                                  match.team1Id,
                                  match.team2Id,
                                  e.target.value,
                                  match.score2 !== null && match.score2 !== undefined ? String(match.score2) : ''
                                )
                              }
                              placeholder="0"
                              className="w-20 sm:w-24 bg-slate-950 border-2 border-cyan-500/60 rounded-xl py-2 text-center font-mono font-black text-2xl text-yellow-300 focus:border-cyan-400 focus:outline-none shadow-inner"
                            />

                            <span className="font-orbitron font-black text-base text-cyan-400 px-1">VS</span>

                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={match.score2 !== null && match.score2 !== undefined ? match.score2 : ''}
                              onChange={(e) =>
                                handlePairScoreChangeA(
                                  match.id,
                                  match.team1Id,
                                  match.team2Id,
                                  match.score1 !== null && match.score1 !== undefined ? String(match.score1) : '',
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="w-20 sm:w-24 bg-slate-950 border-2 border-cyan-500/60 rounded-xl py-2 text-center font-mono font-black text-2xl text-yellow-300 focus:border-cyan-400 focus:outline-none shadow-inner"
                            />
                          </div>

                          {/* Team 2 Side */}
                          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-1/3">
                            <button
                              type="button"
                              onClick={() => handleManualWinnerChangeA(match.id, match.team2Id)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-orbitron font-extrabold transition shrink-0 ${
                                isT2Winner
                                  ? 'bg-amber-400 text-slate-950 border border-amber-300 shadow-md font-black scale-105'
                                  : 'bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-700 font-bold'
                              }`}
                            >
                              {isT2Winner ? '🏆 THẮNG' : '⚪ Chọn Thắng'}
                            </button>

                            <span className="font-orbitron font-black text-xl sm:text-2xl text-amber-300 truncate md:text-right">
                              {t2?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* BẢNG B */}
          {(activeTab === 'B_EV3' || activeTab === 'B_SPIKE') && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-cyan-400 font-orbitron font-extrabold text-sm sm:text-base border-b border-slate-800 pb-3">
                NHẬP ĐIỂM BẢNG B - {activeTab === 'B_EV3' ? 'MINDSTORMS EV3' : 'SPIKE PRIME'}
              </h3>

              {(activeTab === 'B_EV3' ? (formData?.teamsB_EV3 || []) : (formData?.teamsB_SPIKE || [])).length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <p className="text-sm sm:text-base font-orbitron">Bảng B ({activeTab === 'B_EV3' ? 'EV3' : 'SPIKE'}) chưa có đội.</p>
                  <button
                    onClick={() => setActiveTab('TEAMS')}
                    className="bg-cyan-500 text-slate-950 font-orbitron font-bold text-xs px-4 py-2 rounded-lg"
                  >
                    THÊM ĐỘI NGAY
                  </button>
                </div>
              ) : (
                (activeTab === 'B_EV3' ? (formData?.teamsB_EV3 || []) : (formData?.teamsB_SPIKE || [])).map((team) => {
                  const liveList = activeTab === 'B_EV3' ? liveRankedB_EV3 : liveRankedB_SPIKE;
                  const currentRank = getRankPreview(team.id, liveList);
                  return (
                    <div key={team.id} className="bg-slate-950 rounded-xl p-3 sm:p-4 border border-slate-800 space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-800 pb-2">
                        <span className="bg-cyan-500 text-slate-950 font-orbitron font-black text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md shrink-0">
                          HẠNG {currentRank}
                        </span>
                        <span className="font-orbitron font-black text-lg sm:text-xl text-amber-400">{team.name}</span>
                      </div>

                      <div className="space-y-2">
                        {team.rounds.map((round, rIdx) => (
                          <div key={rIdx} className="bg-slate-900 p-2 sm:p-2.5 rounded-lg">
                            <span className="font-orbitron font-bold text-[10px] sm:text-xs text-cyan-300 block mb-1.5 sm:mb-0 sm:inline sm:mr-3 sm:w-20">LƯỢT {rIdx + 1}:</span>
                            <div className="overflow-x-auto no-scrollbar">
                              <div className="grid grid-cols-8 gap-1.5 sm:gap-2 min-w-[360px] sm:min-w-0">
                                {Array.from({ length: 8 }).map((_, taskIdx) => (
                                  <div key={taskIdx} className="flex flex-col items-center">
                                    <span className="text-[8px] sm:text-[9px] text-slate-400 mb-0.5">NV{taskIdx + 1}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={round.tasks[taskIdx] !== null && round.tasks[taskIdx] !== undefined ? round.tasks[taskIdx] : ''}
                                      onChange={(e) =>
                                        handleTaskScoreChangeB(
                                          activeTab as 'B_EV3' | 'B_SPIKE',
                                          team.id,
                                          rIdx,
                                          taskIdx,
                                          e.target.value
                                        )
                                      }
                                      className="w-full bg-slate-950 border border-slate-700 rounded py-1 text-center font-mono text-white text-[11px] sm:text-xs font-bold focus:border-cyan-400 focus:outline-none"
                                      placeholder="0"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* BẢNG C */}
          {activeTab === 'C' && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-cyan-400 font-orbitron font-extrabold text-sm sm:text-base border-b border-slate-800 pb-3">
                KẾT QUẢ BẢNG C (1v1)
              </h3>

              {formData.matchesC.length === 0 && formData.teamsC.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <p className="text-sm sm:text-base font-orbitron">Bảng C chưa có đội thi đấu nào.</p>
                  <button
                    onClick={() => setActiveTab('TEAMS')}
                    className="bg-cyan-500 text-slate-950 font-orbitron font-bold text-xs px-4 py-2 rounded-lg"
                  >
                    THÊM ĐỘI BẢNG C NGAY
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {formData.matchesC.map((match) => {
                    const t1 = formData.teamsC.find((t) => t.id === match.team1Id);
                    const t2 = formData.teamsC.find((t) => t.id === match.team2Id);
                    return (
                      <div key={match.id} className="flex items-center justify-between bg-slate-950 p-2.5 sm:p-3.5 rounded-xl border border-slate-800 gap-2">
                        <span className="font-orbitron font-extrabold text-white text-xs sm:text-base w-24 sm:w-40 text-right truncate">{t1?.name || match.team1Id}</span>
                        
                        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                          <input
                            type="number"
                            min="0"
                            value={match.score1}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              const updated: CompetitionData = {
                                ...formData,
                                matchesC: formData.matchesC.map((m) => (m.id === match.id ? { ...m, score1: val, isCompleted: true } : m)),
                              };
                              commitData(updated);
                            }}
                            className="w-14 sm:w-20 bg-slate-900 border border-cyan-500/40 rounded-lg py-1.5 sm:py-2 text-center font-mono font-black text-xl sm:text-2xl text-yellow-300"
                          />
                          <span className="font-orbitron font-black text-slate-500 text-lg sm:text-xl">-</span>
                          <input
                            type="number"
                            min="0"
                            value={match.score2}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              const updated: CompetitionData = {
                                ...formData,
                                matchesC: formData.matchesC.map((m) => (m.id === match.id ? { ...m, score2: val, isCompleted: true } : m)),
                              };
                              commitData(updated);
                            }}
                            className="w-14 sm:w-20 bg-slate-900 border border-cyan-500/40 rounded-lg py-1.5 sm:py-2 text-center font-mono font-black text-xl sm:text-2xl text-yellow-300"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const updated: CompetitionData = {
                                ...formData,
                                matchesC: formData.matchesC.map((m) => (m.id === match.id ? { ...m, isCompleted: !m.isCompleted } : m)),
                              };
                              commitData(updated);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold transition ${
                              match.isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {match.isCompleted ? '✅ ĐÃ ĐẤU' : '⏳ CHƯA ĐẤU'}
                          </button>
                        </div>

                        <span className="font-orbitron font-extrabold text-white text-xs sm:text-base w-24 sm:w-40 text-left truncate">{t2?.name || match.team2Id}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TEAMS */}
          {activeTab === 'TEAMS' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-slate-950 rounded-xl p-3 sm:p-4 border border-slate-800 space-y-3 sm:space-y-4">
                <h4 className="font-orbitron font-extrabold text-xs sm:text-sm text-cyan-300">THÊM ĐỘI THI ĐẤU MỚI</h4>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <input
                    type="text"
                    placeholder="Tên Đội (Ví dụ: EV3-09, A10...)"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 sm:px-4 py-2 flex-1 focus:border-cyan-400 focus:outline-none"
                  />

                  <select
                    value={newTeamDivision}
                    onChange={(e) => setNewTeamDivision(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 sm:px-4 py-2 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="A">BẢNG A</option>
                    <option value="B_EV3">BẢNG B - EV3</option>
                    <option value="B_SPIKE">BẢNG B - SPIKE</option>
                    <option value="C">BẢNG C</option>
                  </select>

                  <button
                    onClick={handleAddTeam}
                    className="flex items-center justify-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron font-bold text-xs px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> THÊM ĐỘI
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* BẢNG A */}
                <div className="bg-slate-950 rounded-xl p-3 sm:p-4 border border-slate-800">
                  <h4 className="font-orbitron font-extrabold text-[10px] sm:text-xs text-amber-400 mb-2 sm:mb-3 uppercase">Bảng A ({formData.teamsA.length} Đội)</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {formData.teamsA.map((t) => (
                      <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 px-3 py-2 rounded-lg gap-1.5 border border-slate-800">
                        <span className="font-bold text-white font-orbitron">{t.name}</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {[
                            { id: 'GOLD', label: '🥇 Vàng' },
                            { id: 'SILVER', label: '🥈 Bạc' },
                            { id: 'BRONZE', label: '🥉 Đồng' },
                            { id: 'NONE', label: '⚪ Không' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSetTeamMedal(t.id, 'A', m.id as any)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-orbitron font-bold transition ${
                                (t.customMedal || 'NONE') === m.id
                                  ? 'bg-amber-400 text-slate-950 font-black shadow scale-105'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                          <button onClick={() => handleDeleteTeam(t.id, 'A')} className="text-rose-400 hover:text-rose-300 p-1 ml-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.teamsA.length === 0 && <p className="text-xs text-slate-500">Chưa có đội thi đấu</p>}
                  </div>
                </div>

                {/* BẢNG B - EV3 */}
                <div className="bg-slate-950 rounded-xl p-3 sm:p-4 border border-slate-800">
                  <h4 className="font-orbitron font-extrabold text-[10px] sm:text-xs text-cyan-400 mb-2 sm:mb-3 uppercase">Bảng B - EV3 ({formData.teamsB_EV3.length} Đội)</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {formData.teamsB_EV3.map((t) => (
                      <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 px-3 py-2 rounded-lg gap-1.5 border border-slate-800">
                        <span className="font-bold text-white font-orbitron">{t.name}</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {[
                            { id: 'GOLD', label: '🥇 Vàng' },
                            { id: 'SILVER', label: '🥈 Bạc' },
                            { id: 'BRONZE', label: '🥉 Đồng' },
                            { id: 'NONE', label: '⚪ Không' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSetTeamMedal(t.id, 'B_EV3', m.id as any)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-orbitron font-bold transition ${
                                (t.customMedal || 'NONE') === m.id
                                  ? 'bg-amber-400 text-slate-950 font-black shadow scale-105'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                          <button onClick={() => handleDeleteTeam(t.id, 'B_EV3')} className="text-rose-400 hover:text-rose-300 p-1 ml-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.teamsB_EV3.length === 0 && <p className="text-xs text-slate-500">Chưa có đội thi đấu</p>}
                  </div>
                </div>

                {/* BẢNG B - SPIKE */}
                <div className="bg-slate-950 rounded-xl p-3 sm:p-4 border border-slate-800">
                  <h4 className="font-orbitron font-extrabold text-[10px] sm:text-xs text-purple-400 mb-2 sm:mb-3 uppercase">Bảng B - SPIKE ({formData.teamsB_SPIKE.length} Đội)</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {formData.teamsB_SPIKE.map((t) => (
                      <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 px-3 py-2 rounded-lg gap-1.5 border border-slate-800">
                        <span className="font-bold text-white font-orbitron">{t.name}</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {[
                            { id: 'GOLD', label: '🥇 Vàng' },
                            { id: 'SILVER', label: '🥈 Bạc' },
                            { id: 'BRONZE', label: '🥉 Đồng' },
                            { id: 'NONE', label: '⚪ Không' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSetTeamMedal(t.id, 'B_SPIKE', m.id as any)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-orbitron font-bold transition ${
                                (t.customMedal || 'NONE') === m.id
                                  ? 'bg-amber-400 text-slate-950 font-black shadow scale-105'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                          <button onClick={() => handleDeleteTeam(t.id, 'B_SPIKE')} className="text-rose-400 hover:text-rose-300 p-1 ml-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.teamsB_SPIKE.length === 0 && <p className="text-xs text-slate-500">Chưa có đội thi đấu</p>}
                  </div>
                </div>

                {/* BẢNG C */}
                <div className="bg-slate-950 rounded-xl p-3 sm:p-4 border border-slate-800">
                  <h4 className="font-orbitron font-extrabold text-[10px] sm:text-xs text-emerald-400 mb-2 sm:mb-3 uppercase">Bảng C ({formData.teamsC.length} Đội)</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {formData.teamsC.map((t) => (
                      <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 px-3 py-2 rounded-lg gap-1.5 border border-slate-800">
                        <span className="font-bold text-white font-orbitron">{t.name}</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {[
                            { id: 'GOLD', label: '🥇 Vàng' },
                            { id: 'SILVER', label: '🥈 Bạc' },
                            { id: 'BRONZE', label: '🥉 Đồng' },
                            { id: 'NONE', label: '⚪ Không' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSetTeamMedal(t.id, 'C', m.id as any)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-orbitron font-bold transition ${
                                (t.customMedal || 'NONE') === m.id
                                  ? 'bg-amber-400 text-slate-950 font-black shadow scale-105'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                          <button onClick={() => handleDeleteTeam(t.id, 'C')} className="text-rose-400 hover:text-rose-300 p-1 ml-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.teamsC.length === 0 && <p className="text-xs text-slate-500">Chưa có đội thi đấu</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

