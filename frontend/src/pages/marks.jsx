import React, { useEffect, useState, useRef, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Search, Plus } from 'lucide-react';

function Marks() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [outOfByRound, setOutOfByRound] = useState({});
  const [selectedRound, setSelectedRound] = useState('');
  const [newRound, setNewRound] = useState('');
  const [newRoundOutOf, setNewRoundOutOf] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRound, setEditingRound] = useState('');
  const [editRoundName, setEditRoundName] = useState('');
  const [editRoundOutOf, setEditRoundOutOf] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const updateTimeoutRef = useRef(null);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminPassword('');
    setAuthError('');
  };

  const handlePasswordSubmit = async () => {
    if (!adminPassword.trim()) {
      setAuthError('Please enter password');
      return;
    }

    setAuthenticating(true);
    setAuthError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/verify-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: adminPassword })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid password');
      }

      setIsAuthenticated(true);
      setLoading(true);
      setAdminPassword('');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthenticating(false);
    }
  };

  const fetchMarksBoard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/marks-board`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch marks board');
      }

      const availableRounds = data.rounds || [];
      setRounds(availableRounds);
      setOutOfByRound(data.outOfByRound || {});
      setTeams(data.data || []);
      setSelectedRound((prev) => {
        if (prev && availableRounds.includes(prev)) {
          return prev;
        }
        return availableRounds[0] || '';
      });
    } catch (err) {
      setError(err.message || 'Unable to load marks board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMarksBoard();
    }
  }, [isAuthenticated]);

  const handleCreateRound = async () => {
    if (!newRound.trim()) {
      setError('Please enter a round name');
      return;
    }

    const numericOutOf = Number(newRoundOutOf);
    if (!Number.isFinite(numericOutOf) || numericOutOf < 1) {
      setError('Please enter valid out of marks (minimum 1)');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/marks/round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roundName: newRound.trim(), outOf: numericOutOf })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create round');
      }

      const createdRound = data.round;
      const createdRoundOutOf = Number(data.outOf) || numericOutOf;
      setRounds((prev) => [...prev, createdRound]);
      setOutOfByRound((prev) => ({
        ...prev,
        [createdRound]: createdRoundOutOf
      }));
      setSelectedRound(createdRound);
      setTeams((prev) =>
        prev.map((team) => ({
          ...team,
          roundMarks: {
            ...(team.roundMarks || {}),
            [createdRound]: 0
          },
          total: team.total || 0
        }))
      );
      setNewRound('');
      setNewRoundOutOf('');
      setMessage('Round created successfully');
      setTimeout(() => setMessage(''), 2000);
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Unable to create round');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleEditRound = async () => {
    if (!editRoundName.trim()) {
      setError('Please enter a round name');
      return;
    }

    const numericOutOf = Number(editRoundOutOf);
    if (!Number.isFinite(numericOutOf) || numericOutOf < 1) {
      setError('Please enter valid out of marks (minimum 1)');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/marks/round`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          oldRoundName: editingRound, 
          newRoundName: editRoundName.trim(), 
          outOf: numericOutOf 
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update round');
      }

      // Update rounds list
      setRounds((prev) => prev.map(r => r === editingRound ? editRoundName.trim() : r));
      
      // Update outOfByRound
      setOutOfByRound((prev) => {
        const updated = { ...prev };
        if (editingRound !== editRoundName.trim()) {
          delete updated[editingRound];
        }
        updated[editRoundName.trim()] = numericOutOf;
        return updated;
      });

      // Update teams with new round name
      setTeams((prev) =>
        prev.map((team) => {
          if (editingRound !== editRoundName.trim()) {
            const updatedRoundMarks = { ...team.roundMarks };
            if (updatedRoundMarks[editingRound] !== undefined) {
              updatedRoundMarks[editRoundName.trim()] = updatedRoundMarks[editingRound];
              delete updatedRoundMarks[editingRound];
            }
            return {
              ...team,
              roundMarks: updatedRoundMarks
            };
          }
          return team;
        })
      );

      // Update selected round if it was the one being edited
      if (selectedRound === editingRound) {
        setSelectedRound(editRoundName.trim());
      }

      setMessage('Round updated successfully');
      setTimeout(() => setMessage(''), 2000);
      setShowEditModal(false);
      setEditingRound('');
      setEditRoundName('');
      setEditRoundOutOf('');
    } catch (err) {
      setError(err.message || 'Unable to update round');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkChange = (teamName, roundName, value) => {
    const mark = value === '' ? 0 : Number(value);
    if (!Number.isFinite(mark)) {
      return;
    }

    const roundOutOf = Number(outOfByRound?.[roundName]);
    const maxMark = Number.isFinite(roundOutOf) && roundOutOf > 0 ? roundOutOf : Infinity;
    const normalizedMark = Math.max(0, Math.min(mark, maxMark));

    setTeams((prev) =>
      prev.map((team) => {
        if (team.teamName === teamName) {
          const updatedRoundMarks = {
            ...team.roundMarks,
            [roundName]: normalizedMark
          };
          const total = Object.values(updatedRoundMarks).reduce((sum, val) => sum + val, 0);
          return {
            ...team,
            roundMarks: updatedRoundMarks,
            total
          };
        }
        return team;
      })
    );

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      setError('');

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/marks`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ teamName, roundName, mark: normalizedMark })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to update mark');
        }
      } catch (err) {
        setError(err.message || 'Unable to update mark');
        setTimeout(() => setError(''), 3000);
      } finally {
        setSaving(false);
      }
    }, 3000);
  };

  const selectedRoundOutOf = Number(outOfByRound?.[selectedRound]);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => (b.total || 0) - (a.total || 0));
  }, [teams]);

  const podium = useMemo(() => {
    return sortedTeams.slice(0, 3);
  }, [sortedTeams]);

  const getRankMedal = (rankIndex) => {
    if (rankIndex === 0) return { label: "🥇 GOLD", color: "bg-comic-yellow border border-black" };
    if (rankIndex === 1) return { label: "🥈 SILVER", color: "bg-gray-100 border border-black" };
    if (rankIndex === 2) return { label: "🥉 BRONZE", color: "bg-comic-orange/15 border border-black text-[#8C3C25]" };
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-comic-rays-blue bg-halftone-dots flex flex-col font-comic select-none pb-16 text-black">
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            className="relative w-full max-w-lg bg-white border-3 border-black rounded-2xl p-6 md:p-8 shadow-[4px_4px_0_#000] overflow-hidden bg-halftone-dots-white text-center"
          >
            <div className="absolute top-0 right-0 bg-comic-red border-b-3 border-l-3 border-black px-4 py-1 text-white font-bangers text-xs rounded-tr-2xl">
              SCORE VAULT
            </div>

            <div className="relative text-center mt-4">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-comic-yellow border-3 border-black shadow-[2px_2px_0_#000] mb-3">
                <Trophy size={22} className="stroke-[2.5] text-black" />
              </div>
              <h1 className="text-3xl font-luckiest text-black tracking-tight leading-none mb-1">
                ARENA GATE
              </h1>
              <p className="text-xs font-semibold text-gray-700 max-w-xs mx-auto">
                Authenticate coordinate key to manage score boards and rounds.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePasswordSubmit();
              }}
              className="relative mt-6 space-y-4 text-left"
            >
              <div>
                <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                  SECRET ACCESS PASSWORD
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full h-11 comic-input bg-gray-50 text-black border-3 border-black rounded-lg px-4 font-luckiest tracking-wide focus:bg-comic-yellow/10"
                  placeholder="Enter passcode key"
                  required
                />
              </div>

              <AnimatePresence>
                {authError && (
                  <motion.div 
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl border-3 border-black bg-comic-red p-3 text-white font-bangers text-xs shadow-[2px_2px_0_#000]"
                  >
                    💥 OOPS! {authError}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.01 }}
                type="submit"
                disabled={authenticating}
                className="w-full h-12 rounded-xl text-lg flex items-center justify-center gap-2 comic-btn-primary"
              >
                {authenticating ? "OPENING GATE..." : "OPEN MARKS ARENA"}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-comic-rays-blue bg-halftone-dots flex flex-col font-comic select-none pb-16 text-black justify-center items-center">
        <p className="font-luckiest text-2xl text-white comic-title-shadow animate-pulse">SYNCHRONIZING SCOREBOARDS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-comic-rays-blue bg-halftone-dots flex flex-col font-comic select-none pb-16 text-black">
      <Navbar />
      
      {/* Create Round Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0_#000] bg-halftone-dots-white text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-3.5 left-6 bg-comic-yellow border-2 border-black text-black font-bangers text-[10px] px-2.5 py-0.5 rounded shadow-[1.5px_1.5px_0_#000]">
                NEW STAGE
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="absolute -top-3.5 right-4 bg-comic-red text-white border-2 border-black font-bangers text-[10px] px-3 py-0.5 rounded shadow-[1.5px_1.5px_0_#000] cursor-pointer"
              >
                ✕ CLOSE
              </button>
              
              <h3 className="text-xl font-luckiest text-black mb-3.5 mt-2">ADD MISSION ROUND</h3>

              <div className="space-y-3.5 text-xs font-semibold text-gray-800">
                <div>
                  <label className="block text-xs font-bangers tracking-wider text-black mb-1">ROUND NAME</label>
                  <input
                    type="text"
                    value={newRound}
                    onChange={(e) => setNewRound(e.target.value)}
                    placeholder="e.g., ROUND 1, SEMI FINALS"
                    className="w-full h-10 comic-input bg-gray-50 border-3 border-black rounded-lg px-3 focus:bg-comic-yellow/10 font-semibold text-xs"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !saving) handleCreateRound();
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bangers tracking-wider text-black mb-1">MAX VALUE MARKS</label>
                  <input
                    type="number"
                    min="1"
                    value={newRoundOutOf}
                    onChange={(e) => setNewRoundOutOf(e.target.value)}
                    placeholder="e.g., 10, 20, 50"
                    className="w-full h-10 comic-input bg-gray-50 border-3 border-black rounded-lg px-3 focus:bg-comic-yellow/10 font-semibold text-xs"
                  />
                </div>
                <div className="flex gap-3 pt-3 border-t-2 border-dashed border-black font-bangers text-base">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-white border-3 border-black rounded-lg py-1.5 shadow-[1.5px_1.5px_0_#000]"
                  >
                    ABORT
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    type="button"
                    onClick={handleCreateRound} 
                    disabled={saving}
                    className="flex-1 bg-comic-lime text-black border-3 border-black rounded-lg py-1.5 shadow-[1.5px_1.5px_0_#000] cursor-pointer"
                  >
                    {saving ? 'CONFIGURING...' : '✓ INITIATE'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Round Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0_#000] bg-halftone-dots-white text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-3.5 left-6 bg-comic-yellow border-2 border-black text-black font-bangers text-[10px] px-2.5 py-0.5 rounded shadow-[1.5px_1.5px_0_#000]">
                EDIT STAGE
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute -top-3.5 right-4 bg-comic-red text-white border-2 border-black font-bangers text-[10px] px-3 py-0.5 rounded shadow-[1.5px_1.5px_0_#000] cursor-pointer"
              >
                ✕ CLOSE
              </button>
              
              <h3 className="text-xl font-luckiest text-black mb-3.5 mt-2">EDIT MISSION ROUND</h3>

              <div className="space-y-3.5 text-xs font-semibold text-gray-800">
                <div>
                  <label className="block text-xs font-bangers tracking-wider text-black mb-1">ROUND NAME</label>
                  <input
                    type="text"
                    value={editRoundName}
                    onChange={(e) => setEditRoundName(e.target.value)}
                    placeholder="e.g., ROUND 1, SEMI FINALS"
                    className="w-full h-10 comic-input bg-gray-50 border-3 border-black rounded-lg px-3 focus:bg-comic-yellow/10 font-semibold text-xs text-black"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !saving) handleEditRound();
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bangers tracking-wider text-black mb-1">MAX VALUE MARKS</label>
                  <input
                    type="number"
                    min="1"
                    value={editRoundOutOf}
                    onChange={(e) => setEditRoundOutOf(e.target.value)}
                    placeholder="e.g., 10, 20, 50"
                    className="w-full h-10 comic-input bg-gray-50 border-3 border-black rounded-lg px-3 focus:bg-comic-yellow/10 font-semibold text-xs text-black"
                  />
                </div>
                <div className="flex gap-3 pt-3 border-t-2 border-dashed border-black font-bangers text-base">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-white border-3 border-black rounded-lg py-1.5 shadow-[1.5px_1.5px_0_#000]"
                  >
                    ABORT
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    type="button"
                    onClick={handleEditRound} 
                    disabled={saving}
                    className="flex-1 bg-comic-lime text-black border-3 border-black rounded-lg py-1.5 shadow-[1.5px_1.5px_0_#000] cursor-pointer"
                  >
                    {saving ? 'UPDATING...' : '✓ UPDATE'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto w-full px-4 mt-8 flex-grow">
        
        {/* Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white border-3 border-black p-5 rounded-2xl shadow-[4px_4px_0_#000] relative bg-halftone-dots-white">
          <div className="space-y-0.5 text-left">
            <h1 className="text-2xl font-luckiest text-black tracking-wider leading-none">
              SCORE ARENA LEADERBOARD
            </h1>
            <p className="font-bangers text-xs text-comic-red tracking-widest uppercase mt-1">
              RECORD MARKS AND REVIEW ROUND METRICS
            </p>
          </div>
          <div className="flex items-center gap-2.5 font-bangers text-base">
            <motion.button
              whileHover={{ scale: 1.01 }}
              type="button"
              onClick={handleLogout}
              className="rounded-xl px-4 py-1.5 comic-btn-secondary"
            >
              LOGOUT
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              type="button"
              onClick={() => setShowModal(true)}
              className="bg-comic-lime text-black border-3 border-black rounded-xl px-4 py-1.5 shadow-[2.5px_2.5px_0_#111] hover:scale-102 transition-transform cursor-pointer flex items-center gap-1"
            >
              <Plus size={14} /> CREATE ROUND
            </motion.button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-comic-red border-3 border-black rounded-2xl p-4 text-white font-bangers text-base shadow-[3px_3px_0_#000] mb-6">
            💥 OOPS! {error}
          </div>
        )}
        {/* Global Success Banner */}
        {message && (
          <div className="bg-comic-lime border-3 border-black rounded-2xl p-4 text-black font-bangers text-base shadow-[3px_3px_0_#000] mb-6">
            🔥 SUCCESS: {message}
          </div>
        )}

        {/* DYNAMIC COMIC SCOREBOARD AT TOP */}
        {podium.length > 0 && (
          <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white mb-6">
            <div className="absolute top-0 right-0 bg-comic-red border-b-3 border-l-3 border-black px-4 py-0.5 text-white font-bangers text-[10px] rounded-tr-2xl">
              TOP GLORY SCOREBOARD
            </div>
            
            <h3 className="text-xl font-luckiest text-black text-left mb-4 flex items-center gap-2">
              🏆 ARENA LEADERS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-luckiest text-black">
              {podium.map((team, idx) => {
                const medal = getRankMedal(idx);
                const bgColors = [
                  "bg-comic-yellow/15 border-comic-yellow",
                  "bg-gray-100/50 border-gray-400",
                  "bg-comic-orange/10 border-comic-orange"
                ];

                return (
                  <motion.div
                    key={team._id}
                    whileHover={{ y: -2 }}
                    className={`border-3 border-black rounded-xl p-3 flex items-center justify-between shadow-[2px_2px_0_#000] ${bgColors[idx]}`}
                  >
                    <div className="text-left">
                      {medal && (
                        <span className={`inline-block font-bangers text-[9px] border border-black rounded px-1.5 py-0.25 shadow-[1px_1px_0_#000] mb-1 ${medal.color}`}>
                          {medal.label}
                        </span>
                      )}
                      <h4 className="text-base tracking-wide leading-none">{team.teamName}</h4>
                    </div>
                    
                    {/* Pulsing Score Sticker */}
                    <div className="bg-white border-2 border-black rounded-lg p-1.5 text-center min-w-[60px] shadow-[1.5px_1.5px_0_#000]">
                      <span className="font-bangers text-xl text-comic-red block leading-none">{team.total ?? 0}</span>
                      <span className="text-[8px] font-comic font-bold text-gray-500 block leading-none mt-0.5">PTS</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Rounds Selector Tabs */}
        <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white mb-6 text-left">
          <div className="absolute top-0 right-0 bg-comic-cyan border-b-3 border-l-3 border-black px-4 py-0.5 text-black font-bangers text-[10px] rounded-tr-2xl">
            ROUND SELECT
          </div>
          
          <h3 className="text-base font-luckiest text-black mb-3">ACTIVE STAGE</h3>
          
          {rounds.length === 0 ? (
            <p className="text-gray-600 font-semibold italic text-xs">
              No battle stages configured yet. Click "+ CREATE ROUND" to deploy one!
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap font-luckiest text-sm">
              {rounds.map((round) => {
                const isSelected = selectedRound === round;
                return (
                  <div key={round} className="flex gap-1.5 items-center">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      type="button"
                      onClick={() => setSelectedRound(round)}
                      className={`px-4 py-1.5 border-3 border-black rounded-xl shadow-[2.5px_2.5px_0_#111] cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-bright-orange text-white'
                          : 'bg-white text-black hover:bg-light-gray'
                      }`}
                    >
                      {round.toUpperCase()}
                    </motion.button>
                    
                    {/* Pencil Edit button styled in comic theme */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      type="button"
                      onClick={() => {
                        setEditingRound(round);
                        setEditRoundName(round);
                        setEditRoundOutOf(String(outOfByRound[round] || ''));
                        setShowEditModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-comic-cyan border-3 border-black text-black shadow-[2px_2px_0_#000] hover:bg-cyan-400 transition-all cursor-pointer text-xs"
                      title="Edit stage"
                    >
                      ✏️
                    </motion.button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Table Arena */}
        {teams.length === 0 ? (
          <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-[4px_4px_0_#000] text-center font-luckiest text-lg text-black">
            NO ALLIANCES LOGGED IN ARENA RECORDERS YET.
          </div>
        ) : (
          <>
            {/* Search filter */}
            <div className="mb-5 bg-white border-3 border-black p-3 rounded-2xl shadow-[3px_3px_0_#000] relative bg-halftone-dots-white">
              <div className="absolute top-0 right-0 bg-comic-yellow border-b-2 border-l-2 border-black px-3 py-0.5 font-bangers text-[9px] text-black">
                SCANNER
              </div>
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Scan alliance title..."
                  className="w-full h-10 comic-input bg-gray-50 border-3 border-black rounded-lg pl-9 pr-4 focus:bg-comic-yellow/10 font-semibold text-xs text-black"
                />
              </div>
            </div>

            {/* Scoreboard Table */}
            <div className="bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0_#000] overflow-hidden">
              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-comic-blue border-b-3 border-black text-white font-bangers text-sm tracking-wider">
                      <th className="px-4 py-3 text-left border-r-2 border-black">ALLIANCE TEAM NAME</th>
                      <th className="px-4 py-3 text-center border-r-2 border-black">
                        {selectedRound
                          ? `${selectedRound.toUpperCase()} (MAX: ${Number.isFinite(selectedRoundOutOf) ? selectedRoundOutOf : '-'})`
                          : 'SELECT ACTIVE STAGE'}
                      </th>
                      <th className="px-4 py-3 text-center">TOTAL ARENA SCORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTeams
                      .filter((team) => 
                        team.teamName.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((team, index) => {
                        const roundValue = selectedRound ? team.roundMarks?.[selectedRound] ?? 0 : 0;
                        const rankIdx = teams.findIndex(t => t.teamName === team.teamName);
                        
                        return (
                          <tr 
                            key={team._id}
                            className={`border-b-2 border-black transition-colors hover:bg-[#fffbe6] ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                          >
                            <td className="px-4 py-3 border-r-2 border-black font-luckiest text-sm text-black flex items-center gap-2 text-left">
                              {rankIdx < 3 ? (
                                <span className="text-base leading-none">
                                  {rankIdx === 0 ? "🥇" : rankIdx === 1 ? "🥈" : "🥉"}
                                </span>
                              ) : (
                                <span className="font-bangers text-[9px] text-gray-400 border border-gray-300 rounded px-1.5 min-w-[20px] text-center inline-block">
                                  #{rankIdx + 1}
                                </span>
                              )}
                              {team.teamName}
                            </td>
                            
                            <td className="px-4 py-3 border-r-2 border-black text-center">
                              {selectedRound ? (
                                <div className="inline-flex py-0.5 px-2 bg-gray-50 border-2 border-black rounded-lg shadow-[1.5px_1.5px_0_#000] focus-within:bg-comic-yellow/10 transition-colors">
                                  <input 
                                    className="w-14 p-0 bg-transparent border-0 text-center text-black font-luckiest text-sm outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                                    style={{MozAppearance: 'textfield'}}
                                    type="number" 
                                    value={roundValue}
                                    onChange={(e) => handleMarkChange(team.teamName, selectedRound, e.target.value)}
                                    disabled={saving}
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-500 font-bangers text-xs italic">SELECT TAB</span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center font-luckiest text-base text-comic-red">
                              <motion.div 
                                key={team.total}
                                animate={{ scale: [1, 1.05, 1] }}
                                className="inline-block bg-comic-yellow/20 border border-dashed border-black px-3.5 py-1 rounded-lg shadow-[1.5px_1.5px_0_#000]"
                              >
                                {team.total ?? 0}
                              </motion.div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {teams.filter((team) => team.teamName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="p-6 text-center text-gray-500 font-bangers tracking-wider uppercase">
                    NO ALLIANCE COORDINATES MATCH "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Marks;