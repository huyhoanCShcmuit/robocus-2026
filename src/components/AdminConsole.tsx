import React, { useState, useEffect } from 'react';
import type { CompetitionData, TeamA, TeamB, TeamC } from '../types';
import { calculateRankingsA, calculateRankingsB, calculateRankingsC } from '../utils/rankingEngine';
import { X, Plus, Trash2, Download, Upload, RefreshCw, Trophy, CheckCircle, Zap } from 'lucide-react';

interface AdminConsoleProps {
  data: CompetitionData;
  onSave: (newData: CompetitionData) => void;
  onClose: () => void;
  onReset: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  data,
  onSave,
  onClose,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'A' | 'B_EV3' | 'B_SPIKE' | 'C' | 'TEAMS'>('A');
  const [formData, setFormData] = useState<CompetitionData>(JSON.parse(JSON.stringify(data)));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync internal state if external data updates
  useEffect(() => {
    setFormData(JSON.parse(JSON.stringify(data)));
  }, [data]);

  // Helper to commit changes immediately (Instant Real-time Auto Rerank)
  const commitData = (newData: CompetitionData) => {
    setFormData(newData);
    onSave(newData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1000);
  };

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDivision, setNewTeamDivision] = useState<'A' | 'B_EV3' | 'B_SPIKE' | 'C'>('A');

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

  // Handle Team Addition
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

  // Handle Score Input Bảng A
  const handleScoreChangeA = (teamId: string, matchIdx: number, val: string) => {
    const num = val === '' ? null : Math.min(100, Math.max(0, parseInt(val) || 0));
    const updated: CompetitionData = {
      ...formData,
      teamsA: formData.teamsA.map((t) => {
        if (t.id === teamId) {
          const newScores = [...t.scores];
          newScores[matchIdx] = num;
          return { ...t, scores: newScores };
        }
        return t;
      }),
    };
    commitData(updated);
  };

  // Handle Wins Input Bảng A
  const handleWinsChangeA = (teamId: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    const updated: CompetitionData = {
      ...formData,
      teamsA: formData.teamsA.map((t) => (t.id === teamId ? { ...t, wins: num } : t)),
    };
    commitData(updated);
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

    const updated: CompetitionData = {
      ...formData,
      [key]: formData[key].map((t) => {
        if (t.id === teamId) {
          const newRounds = t.rounds.map((rd) => {
            if (rd.roundIndex === roundIdx) {
              const newTasks = [...rd.tasks];
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

  // Calculate live preview rankings inside Admin Console
  const liveRankedA = calculateRankingsA(formData.teamsA, formData.matchesA);
  const liveRankedB_EV3 = calculateRankingsB(formData.teamsB_EV3);
  const liveRankedB_SPIKE = calculateRankingsB(formData.teamsB_SPIKE);
  const liveRankedC = calculateRankingsC(formData.teamsC, formData.matchesC);

  // Helper map for rank preview
  const getRankPreview = (teamId: string, rankedList: { id: string; rank: number }[]) => {
    const item = rankedList.find((r) => r.id === teamId);
    return item ? item.rank : '-';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-cyan-500/60 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-950 p-4 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="font-orbitron font-extrabold text-xl text-white tracking-wider">
              ADMIN CONSOLE - BẢNG XẾP HẠNG REAL-TIME
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold bg-cyan-950/80 px-3 py-1.5 rounded-full border border-cyan-500/40 animate-pulse">
              <Zap className="w-4 h-4 text-cyan-400" /> TỰ ĐỘNG RERANK TỨC THÌ
            </span>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                <CheckCircle className="w-4 h-4" /> Đã cập nhật!
              </span>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="bg-slate-950/60 px-4 pt-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            {[
              { id: 'A', label: 'BẢNG A (THẮNG & T1..T8)' },
              { id: 'B_EV3', label: 'BẢNG B (EV3 - 5 LƯỢT)' },
              { id: 'B_SPIKE', label: 'BẢNG B (SPIKE - 5 LƯỢT)' },
              { id: 'C', label: 'BẢNG C (SOCCER 1v1)' },
              { id: 'TEAMS', label: 'QUẢN LÝ ĐỘI THI' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-orbitron text-xs font-extrabold rounded-t-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-lg'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs px-3 py-1.5 rounded font-bold border border-cyan-500/30"
              title="Xuất file JSON sao lưu"
            >
              <Download className="w-3.5 h-3.5" /> EXPORT JSON
            </button>

            <label className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs px-3 py-1.5 rounded font-bold border border-cyan-500/30 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> IMPORT JSON
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              onClick={onReset}
              className="flex items-center gap-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs px-3 py-1.5 rounded font-bold border border-rose-500/40"
              title="Khôi phục dữ liệu mẫu ban đầu"
            >
              <RefreshCw className="w-3.5 h-3.5" /> RESET DEMO
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* BẢNG A EDITOR */}
          {activeTab === 'A' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-cyan-400 font-orbitron font-extrabold text-base">
                  NHẬP ĐIỂM BẢNG A (Nhập Số Trận THẮNG & Các Trận đấu T1..T8)
                </h3>
                <span className="text-xs text-slate-400">Tự động xếp hạng ưu tiên: THẮNG $\rightarrow$ ĐIỂM $\rightarrow$ Đối đầu</span>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
                {formData.teamsA.map((team) => {
                  const currentRank = getRankPreview(team.id, liveRankedA);
                  return (
                    <div key={team.id} className="flex items-center justify-between gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                      {/* Live Rank Preview Badge */}
                      <div className="flex items-center gap-2 w-32">
                        <span className="bg-cyan-500 text-slate-950 font-orbitron font-black text-xs px-2 py-1 rounded">
                          HẠNG {currentRank}
                        </span>
                        <span className="font-orbitron font-black text-lg text-amber-400">{team.name}</span>
                      </div>

                      {/* Wins Input */}
                      <div className="flex flex-col items-center bg-amber-950/40 p-1.5 rounded border border-amber-500/40">
                        <span className="text-[10px] text-amber-300 font-bold mb-0.5">THẮNG</span>
                        <input
                          type="number"
                          min="0"
                          value={team.wins !== undefined ? team.wins : 0}
                          onChange={(e) => handleWinsChangeA(team.id, e.target.value)}
                          className="w-14 bg-slate-950 border border-amber-400/60 rounded py-1 text-center font-mono text-amber-300 text-sm font-bold focus:outline-none"
                        />
                      </div>

                      {/* Scores T1..T8 */}
                      <div className="grid grid-cols-8 gap-2 flex-1">
                        {Array.from({ length: 8 }).map((_, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 font-bold mb-1">T{idx + 1}</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={team.scores[idx] !== null && team.scores[idx] !== undefined ? team.scores[idx] : ''}
                              onChange={(e) => handleScoreChangeA(team.id, idx, e.target.value)}
                              className="w-full bg-slate-950 border border-cyan-500/30 rounded py-1 text-center font-mono text-white text-sm font-bold focus:border-cyan-400 focus:outline-none"
                              placeholder="-"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BẢNG B (EV3 & SPIKE) EDITOR */}
          {(activeTab === 'B_EV3' || activeTab === 'B_SPIKE') && (
            <div className="space-y-4">
              <h3 className="text-cyan-400 font-orbitron font-extrabold text-base">
                NHẬP ĐIỂM CHI TIẾT NHIỆM VỤ (BẢNG B - {activeTab === 'B_EV3' ? 'MINDSTORMS EV3' : 'SPIKE PRIME'})
              </h3>

              {(activeTab === 'B_EV3' ? formData.teamsB_EV3 : formData.teamsB_SPIKE).map((team) => {
                const liveList = activeTab === 'B_EV3' ? liveRankedB_EV3 : liveRankedB_SPIKE;
                const currentRank = getRankPreview(team.id, liveList);
                return (
                  <div key={team.id} className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-3">
                        <span className="bg-cyan-500 text-slate-950 font-orbitron font-black text-xs px-2 py-1 rounded">
                          HẠNG {currentRank}
                        </span>
                        <span className="font-orbitron font-black text-xl text-amber-400">{team.name}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {team.rounds.map((round, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-lg">
                          <span className="font-orbitron font-bold text-xs text-cyan-300 w-20">LƯỢT {rIdx + 1}:</span>
                          <div className="grid grid-cols-8 gap-2 flex-1">
                            {Array.from({ length: 8 }).map((_, taskIdx) => (
                              <div key={taskIdx} className="flex flex-col items-center">
                                <span className="text-[9px] text-slate-400 mb-0.5">NV {taskIdx + 1}</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={round.tasks[taskIdx] || ''}
                                  onChange={(e) =>
                                    handleTaskScoreChangeB(
                                      activeTab as 'B_EV3' | 'B_SPIKE',
                                      team.id,
                                      rIdx,
                                      taskIdx,
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded py-1 text-center font-mono text-white text-xs font-bold focus:border-cyan-400 focus:outline-none"
                                  placeholder="0"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BẢNG C EDITOR */}
          {activeTab === 'C' && (
            <div className="space-y-4">
              <h3 className="text-cyan-400 font-orbitron font-extrabold text-base">
                KẾT QUẢ CÁC TRẬN ĐẤU BẢNG C (ROBOT ĐÁ BÓNG 1v1)
              </h3>

              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
                {formData.matchesC.map((match) => {
                  const t1 = formData.teamsC.find((t) => t.id === match.team1Id);
                  const t2 = formData.teamsC.find((t) => t.id === match.team2Id);
                  return (
                    <div key={match.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <span className="font-orbitron font-extrabold text-white text-sm w-36 text-right">{t1?.name || match.team1Id}</span>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={match.score1}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const updated: CompetitionData = {
                              ...formData,
                              matchesC: formData.matchesC.map((m) => (m.id === match.id ? { ...m, score1: val } : m)),
                            };
                            commitData(updated);
                          }}
                          className="w-16 bg-slate-950 border border-cyan-500/40 rounded py-1.5 text-center font-mono font-black text-xl text-yellow-300"
                        />
                        <span className="font-orbitron font-black text-slate-500 px-2">-</span>
                        <input
                          type="number"
                          min="0"
                          value={match.score2}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const updated: CompetitionData = {
                              ...formData,
                              matchesC: formData.matchesC.map((m) => (m.id === match.id ? { ...m, score2: val } : m)),
                            };
                            commitData(updated);
                          }}
                          className="w-16 bg-slate-950 border border-cyan-500/40 rounded py-1.5 text-center font-mono font-black text-xl text-yellow-300"
                        />
                      </div>

                      <span className="font-orbitron font-extrabold text-white text-sm w-36 text-left">{t2?.name || match.team2Id}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bảng C Live Rank Preview */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
                <h4 className="font-orbitron font-extrabold text-xs text-amber-400 mb-3">XEM TRƯỚC THỨ HẠNG BẢNG C REALTIME</h4>
                <div className="grid grid-cols-5 gap-2">
                  {liveRankedC.map((t) => (
                    <div key={t.id} className="bg-slate-900 p-2.5 rounded border border-slate-800 text-center">
                      <div className="text-[10px] text-cyan-400 font-bold font-orbitron">HẠNG {t.rank}</div>
                      <div className="font-orbitron font-black text-sm text-white">{t.name}</div>
                      <div className="text-xs text-yellow-400 font-bold">{t.points}đ | HS: {t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TEAM MANAGEMENT */}
          {activeTab === 'TEAMS' && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-4">
                <h4 className="font-orbitron font-extrabold text-sm text-cyan-300">THÊM ĐỘI THI ĐẤU MỚI</h4>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Tên Đội (Ví dụ: EV3-09, SPIKE-05, A10...)"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 flex-1 focus:border-cyan-400 focus:outline-none"
                  />

                  <select
                    value={newTeamDivision}
                    onChange={(e) => setNewTeamDivision(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="A">BẢNG A</option>
                    <option value="B_EV3">BẢNG B - EV3</option>
                    <option value="B_SPIKE">BẢNG B - SPIKE</option>
                    <option value="C">BẢNG C</option>
                  </select>

                  <button
                    onClick={handleAddTeam}
                    className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron font-bold text-xs px-5 py-2 rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" /> THÊM ĐỘI
                  </button>
                </div>
              </div>

              {/* Existing Teams List */}
              <div className="grid grid-cols-2 gap-4">
                {/* Bảng A Teams */}
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
                  <h4 className="font-orbitron font-extrabold text-xs text-amber-400 mb-3 uppercase">Danh sách Bảng A ({formData.teamsA.length} Đội)</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formData.teamsA.map((t) => (
                      <div key={t.id} className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded text-sm">
                        <span className="font-bold text-white">{t.name}</span>
                        <button onClick={() => handleDeleteTeam(t.id, 'A')} className="text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bảng B EV3 Teams */}
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
                  <h4 className="font-orbitron font-extrabold text-xs text-cyan-400 mb-3 uppercase">Bảng B - EV3 ({formData.teamsB_EV3.length} Đội)</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formData.teamsB_EV3.map((t) => (
                      <div key={t.id} className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded text-sm">
                        <span className="font-bold text-white">{t.name}</span>
                        <button onClick={() => handleDeleteTeam(t.id, 'B_EV3')} className="text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bảng B SPIKE Teams */}
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
                  <h4 className="font-orbitron font-extrabold text-xs text-purple-400 mb-3 uppercase">Bảng B - SPIKE ({formData.teamsB_SPIKE.length} Đội)</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formData.teamsB_SPIKE.map((t) => (
                      <div key={t.id} className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded text-sm">
                        <span className="font-bold text-white">{t.name}</span>
                        <button onClick={() => handleDeleteTeam(t.id, 'B_SPIKE')} className="text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bảng C Teams */}
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
                  <h4 className="font-orbitron font-extrabold text-xs text-emerald-400 mb-3 uppercase">Danh sách Bảng C ({formData.teamsC.length} Đội)</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formData.teamsC.map((t) => (
                      <div key={t.id} className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded text-sm">
                        <span className="font-bold text-white">{t.name}</span>
                        <button onClick={() => handleDeleteTeam(t.id, 'C')} className="text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
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
